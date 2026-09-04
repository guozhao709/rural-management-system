import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { HealthAccessAudit } from './entities/health-access-audit.entity';
import { HealthAssessment } from './entities/health-assessment.entity';
import { HealthConsent } from './entities/health-consent.entity';
import { HealthMeasurement } from './entities/health-measurement.entity';
import { HealthProfile } from './entities/health-profile.entity';

/** Explicit lifecycle boundary for scheduled retention work and account deletion. */
@Injectable()
export class HealthDataLifecycleService {
  constructor(
    @InjectRepository(HealthAssessment) private readonly assessments: EntityRepository<HealthAssessment>,
    @InjectRepository(HealthMeasurement) private readonly measurements: EntityRepository<HealthMeasurement>,
    @InjectRepository(HealthProfile) private readonly profiles: EntityRepository<HealthProfile>,
    @InjectRepository(HealthConsent) private readonly consents: EntityRepository<HealthConsent>,
    @InjectRepository(HealthAccessAudit) private readonly audits: EntityRepository<HealthAccessAudit>,
    private readonly config: ConfigService,
  ) {}

  async purgeForUser(userId: number): Promise<void> {
    await this.assessments.nativeDelete({ userId });
    await this.measurements.nativeDelete({ userId });
    await this.profiles.nativeDelete({ userId });
    await this.consents.nativeDelete({ userId });
    await this.audits.nativeDelete({ actorType: 'user', actorId: String(userId) });
  }

  async purgeExpired(now = new Date()): Promise<void> {
    const retentionDays = this.config.get<number>('residentHealth.retentionDays') ?? 365;
    const cutoff = new Date(now);
    cutoff.setUTCDate(cutoff.getUTCDate() - retentionDays);
    await this.assessments.nativeDelete({ deletedAt: { $ne: null, $lte: cutoff } });
    await this.measurements.nativeDelete({ deletedAt: { $ne: null, $lte: cutoff } });
  }
}
