import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, QueryOrder, UniqueConstraintViolationException } from '@mikro-orm/core';
import type { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { argon2id, hash } from 'argon2';
import { AccountStatus } from '../../common/enums/account-status.enum';
import type { CreateUserDto } from './dto/create-user.dto';
import type { QueryUserDto } from './dto/query-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { UserListPresenter, UserPresenter } from './presenters/user.presenter';
import { User, UserGender } from './user.entity';
import { HealthDataLifecycleService } from '../resident-health/health-data-lifecycle.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: EntityRepository<User>,
    private readonly entityManager: EntityManager,
    private readonly healthLifecycle: HealthDataLifecycleService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserPresenter> {
    await this.ensurePhoneAvailable(dto.phone);
    const user = this.users.create(
      {
        phone: dto.phone,
        passwordHash: await this.hashPassword(dto.password),
        name: dto.name,
        gender: dto.gender ?? UserGender.Unknown,
        birthday: dto.birthday ?? null,
        address: dto.address ?? null,
        status: dto.status ?? AccountStatus.Active,
      },
      { partial: true },
    );

    await this.flushUniqueConflict(() => this.entityManager.flush());
    return UserPresenter.from(user);
  }

  async findAll(query: QueryUserDto): Promise<UserListPresenter> {
    const where: FilterQuery<User> = { deletedAt: null };

    if (query.keyword) {
      where.$or = [
        { name: { $ilike: `%${query.keyword}%` } },
        { phone: { $ilike: `%${query.keyword}%` } },
      ];
    }
    if (query.gender) where.gender = query.gender;
    if (query.status) where.status = query.status;

    const [entities, total] = await this.users.findAndCount(where, {
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
      orderBy: { createdAt: QueryOrder.DESC },
    });

    return {
      list: entities.map((entity) => UserPresenter.from(entity)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async findOne(id: number): Promise<UserPresenter> {
    return UserPresenter.from(await this.getActiveUser(id));
  }

  async update(id: number, dto: UpdateUserDto): Promise<UserPresenter> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('至少提供一个可修改字段');
    }

    const user = await this.getActiveUser(id);
    if (dto.phone && dto.phone !== user.phone) {
      await this.ensurePhoneAvailable(dto.phone, id);
    }

    this.users.assign(user, {
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.gender !== undefined && { gender: dto.gender }),
      ...(dto.birthday !== undefined && { birthday: dto.birthday }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.password !== undefined && { passwordHash: await this.hashPassword(dto.password) }),
    });

    await this.flushUniqueConflict(() => this.entityManager.flush());
    return UserPresenter.from(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.getActiveUser(id);
    await this.healthLifecycle.purgeForUser(user.id);
    user.deletedAt = new Date();
    await this.entityManager.flush();
  }

  private async getActiveUser(id: number): Promise<User> {
    const user = await this.users.findOne({ id, deletedAt: null });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  private async ensurePhoneAvailable(phone: string, excludedId?: number): Promise<void> {
    const where: FilterQuery<User> = { phone };
    if (excludedId !== undefined) where.id = { $ne: excludedId };
    if (await this.users.findOne(where)) throw new ConflictException('用户手机号已存在');
  }

  private async hashPassword(password: string): Promise<string> {
    return hash(password, { type: argon2id });
  }

  private async flushUniqueConflict(operation: () => Promise<unknown>): Promise<void> {
    try {
      await operation();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException('用户手机号已存在');
      }
      throw error;
    }
  }
}
