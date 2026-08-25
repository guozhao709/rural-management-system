import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { User } from '../users/user.entity';
import {
  HEALTH_SENSITIVE_DATA_CRYPTO_PORT,
  type EncryptedHealthData,
  type HealthSensitiveDataCryptoPort,
} from './health-sensitive-data-crypto';
import { healthMeasurementSchema } from './measurement.schema';
import type { CreateHealthConsentDto } from './dto/create-health-consent.dto';
import type { CreateHealthMeasurementDto } from './dto/create-health-measurement.dto';
import type { QueryHealthMeasurementsDto } from './dto/query-health-measurements.dto';
import type { QueryHealthTrendsDto } from './dto/query-health-trends.dto';
import type { UpdateHealthProfileDto } from './dto/update-health-profile.dto';
import { HealthConsent } from './entities/health-consent.entity';
import { HealthMeasurement } from './entities/health-measurement.entity';
import { HealthProfile } from './entities/health-profile.entity';
import type { HealthConsentScope } from './resident-health.types';
import { Inject } from '@nestjs/common';

export interface HealthConsentPresenter {
  id: string;
  noticeVersion: string;
  scopes: string[];
  grantedAt: Date;
}
export interface HealthProfilePresenter {
  medicalHistory: string | null;
  allergies: string | null;
  specialPopulation: string | null;
  updatedAt: Date | null;
}
export interface HealthMeasurementPresenter {
  id: string;
  type: string;
  source: string;
  measuredAt: Date;
  values: object;
  createdAt: Date;
}

@Injectable()
export class ResidentHealthService {
  constructor(
    @InjectRepository(HealthConsent) private readonly consents: EntityRepository<HealthConsent>,
    @InjectRepository(HealthProfile) private readonly profiles: EntityRepository<HealthProfile>,
    @InjectRepository(HealthMeasurement)
    private readonly measurements: EntityRepository<HealthMeasurement>,
    private readonly entityManager: EntityManager,
    @Inject(HEALTH_SENSITIVE_DATA_CRYPTO_PORT)
    private readonly crypto: HealthSensitiveDataCryptoPort | null,
  ) {}

  async grantConsent(user: User, dto: CreateHealthConsentDto): Promise<HealthConsentPresenter> {
    const active = await this.consents.findOne({ userId: user.id, revokedAt: null });
    if (
      active &&
      active.noticeVersion === dto.noticeVersion &&
      this.sameScopes(active.scopes, dto.scopes)
    )
      return this.presentConsent(active);
    if (active) active.revokedAt = new Date();
    const consent = this.consents.create(
      {
        userId: user.id,
        noticeVersion: dto.noticeVersion,
        scopes: [...new Set(dto.scopes)],
        grantedAt: new Date(),
      },
      { partial: true },
    );
    await this.entityManager.flush();
    return this.presentConsent(consent);
  }

  async getCurrentConsent(user: User): Promise<HealthConsentPresenter | null> {
    const consent = await this.consents.findOne({ userId: user.id, revokedAt: null });
    return consent ? this.presentConsent(consent) : null;
  }

  async revokeCurrentConsent(user: User): Promise<void> {
    const consent = await this.consents.findOne({ userId: user.id, revokedAt: null });
    if (!consent) throw new NotFoundException('当前健康同意不存在');
    consent.revokedAt = new Date();
    await this.entityManager.flush();
  }

  async getProfile(user: User): Promise<HealthProfilePresenter> {
    const profile = await this.profiles.findOne({ userId: user.id });
    if (!profile)
      return { medicalHistory: null, allergies: null, specialPopulation: null, updatedAt: null };
    return {
      medicalHistory: this.decrypt(profile.medicalHistoryCiphertext),
      allergies: this.decrypt(profile.allergiesCiphertext),
      specialPopulation: this.decrypt(profile.specialPopulationCiphertext),
      updatedAt: profile.updatedAt,
    };
  }

  async updateProfile(user: User, dto: UpdateHealthProfileDto): Promise<HealthProfilePresenter> {
    await this.requireScope(user.id, 'profile');
    if (!this.crypto) throw new ServiceUnavailableException('健康数据加密能力未启用');
    if (Object.keys(dto).length === 0) throw new BadRequestException('至少提供一个可修改字段');
    let profile = await this.profiles.findOne({ userId: user.id });
    if (!profile) profile = this.profiles.create({ userId: user.id }, { partial: true });
    this.applyEncrypted(profile, 'medicalHistoryCiphertext', dto, 'medicalHistory');
    this.applyEncrypted(profile, 'allergiesCiphertext', dto, 'allergies');
    this.applyEncrypted(profile, 'specialPopulationCiphertext', dto, 'specialPopulation');
    profile.keyVersion = this.crypto.encrypt('').keyVersion;
    await this.entityManager.flush();
    return this.getProfile(user);
  }

  async createMeasurement(
    user: User,
    dto: CreateHealthMeasurementDto,
  ): Promise<HealthMeasurementPresenter> {
    await this.requireScope(user.id, 'measurement');
    const parsed = healthMeasurementSchema.safeParse({
      type: dto.type,
      source: dto.source,
      measuredAt: dto.measuredAt,
      ...dto.values,
    });
    if (!parsed.success) throw new BadRequestException('健康测量格式、单位或时间无效');
    const { type, source, measuredAt, ...values } = parsed.data;
    const measurement = this.measurements.create(
      { userId: user.id, type, source, measuredAt, values },
      { partial: true },
    );
    await this.entityManager.flush();
    return this.presentMeasurement(measurement);
  }

  async listMeasurements(
    user: User,
    query: QueryHealthMeasurementsDto,
  ): Promise<{
    list: HealthMeasurementPresenter[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const where: FilterQuery<HealthMeasurement> = { userId: user.id, deletedAt: null };
    if (query.type) where.type = query.type;
    if (query.from || query.to)
      where.measuredAt = {
        ...(query.from && { $gte: new Date(query.from) }),
        ...(query.to && { $lte: new Date(query.to) }),
      };
    const [items, total] = await this.measurements.findAndCount(where, {
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
      orderBy: { measuredAt: 'DESC' },
    });
    return {
      list: items.map((item) => this.presentMeasurement(item)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async deleteMeasurement(user: User, id: string): Promise<void> {
    const measurement = await this.measurements.findOne({ id, userId: user.id, deletedAt: null });
    if (!measurement) throw new NotFoundException('健康测量不存在');
    measurement.deletedAt = new Date();
    await this.entityManager.flush();
  }

  async measurementTrend(user: User, query: QueryHealthTrendsDto) {
    const from = new Date();
    from.setUTCDate(from.getUTCDate() - Number.parseInt(query.range, 10));
    const items = await this.measurements.find(
      { userId: user.id, type: query.type, deletedAt: null, measuredAt: { $gte: from } },
      { orderBy: { measuredAt: 'ASC' } },
    );
    return items.map((item) => this.presentMeasurement(item));
  }

  private async requireScope(userId: number, scope: HealthConsentScope): Promise<void> {
    const consent = await this.consents.findOne({ userId, revokedAt: null });
    if (!consent || !consent.scopes.includes(scope))
      throw new ServiceUnavailableException('需要有效的健康数据处理同意');
  }
  private applyEncrypted(
    profile: HealthProfile,
    field: keyof Pick<
      HealthProfile,
      'medicalHistoryCiphertext' | 'allergiesCiphertext' | 'specialPopulationCiphertext'
    >,
    dto: UpdateHealthProfileDto,
    input: keyof UpdateHealthProfileDto,
  ): void {
    if (!(input in dto)) return;
    const value = dto[input];
    profile[field] = value === null ? null : this.crypto!.encrypt(value as string);
  }
  private decrypt(value: object | null): string | null {
    return value ? this.cryptoOrThrow().decrypt(value as EncryptedHealthData) : null;
  }
  private cryptoOrThrow(): HealthSensitiveDataCryptoPort {
    if (!this.crypto) throw new ServiceUnavailableException('健康数据加密能力未启用');
    return this.crypto;
  }
  private presentConsent(consent: HealthConsent): HealthConsentPresenter {
    return {
      id: consent.id,
      noticeVersion: consent.noticeVersion,
      scopes: consent.scopes,
      grantedAt: consent.grantedAt,
    };
  }
  private presentMeasurement(measurement: HealthMeasurement): HealthMeasurementPresenter {
    return {
      id: measurement.id,
      type: measurement.type,
      source: measurement.source,
      measuredAt: measurement.measuredAt,
      values: measurement.values,
      createdAt: measurement.createdAt,
    };
  }
  private sameScopes(left: string[], right: string[]): boolean {
    return left.length === right.length && left.every((value) => right.includes(value));
  }
}
