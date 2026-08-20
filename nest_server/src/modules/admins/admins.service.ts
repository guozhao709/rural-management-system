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
import { Admin, AdminRole } from './admin.entity';
import type { CreateAdminDto } from './dto/create-admin.dto';
import type { QueryAdminDto } from './dto/query-admin.dto';
import type { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminListPresenter, AdminPresenter } from './presenters/admin.presenter';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private readonly admins: EntityRepository<Admin>,
    private readonly entityManager: EntityManager,
  ) {}

  async create(dto: CreateAdminDto): Promise<AdminPresenter> {
    await this.ensureUsernameAvailable(dto.username);
    const admin = this.admins.create(
      {
        username: dto.username,
        passwordHash: await this.hashPassword(dto.password),
        phone: dto.phone ?? null,
        role: dto.role ?? AdminRole.Admin,
        status: dto.status ?? AccountStatus.Active,
      },
      { partial: true },
    );

    await this.flushUniqueConflict(() => this.entityManager.flush());
    return AdminPresenter.from(admin);
  }

  async findAll(query: QueryAdminDto): Promise<AdminListPresenter> {
    const where: FilterQuery<Admin> = { deletedAt: null };

    if (query.keyword) {
      where.$or = [
        { username: { $ilike: `%${query.keyword}%` } },
        { phone: { $ilike: `%${query.keyword}%` } },
      ];
    }
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;

    const [entities, total] = await this.admins.findAndCount(where, {
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
      orderBy: { createdAt: QueryOrder.DESC },
    });

    return {
      list: entities.map((entity) => AdminPresenter.from(entity)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async findOne(id: number): Promise<AdminPresenter> {
    return AdminPresenter.from(await this.getActiveAdmin(id));
  }

  async update(id: number, dto: UpdateAdminDto): Promise<AdminPresenter> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('至少提供一个可修改字段');
    }

    const admin = await this.getActiveAdmin(id);
    if (dto.username && dto.username !== admin.username) {
      await this.ensureUsernameAvailable(dto.username, id);
    }

    this.admins.assign(admin, {
      ...(dto.username !== undefined && { username: dto.username }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.role !== undefined && { role: dto.role }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.password !== undefined && { passwordHash: await this.hashPassword(dto.password) }),
    });

    await this.flushUniqueConflict(() => this.entityManager.flush());
    return AdminPresenter.from(admin);
  }

  async remove(id: number): Promise<void> {
    const admin = await this.getActiveAdmin(id);
    admin.deletedAt = new Date();
    await this.entityManager.flush();
  }

  private async getActiveAdmin(id: number): Promise<Admin> {
    const admin = await this.admins.findOne({ id, deletedAt: null });
    if (!admin) throw new NotFoundException('管理员不存在');
    return admin;
  }

  private async ensureUsernameAvailable(username: string, excludedId?: number): Promise<void> {
    const where: FilterQuery<Admin> = { username };
    if (excludedId !== undefined) where.id = { $ne: excludedId };
    if (await this.admins.findOne(where)) throw new ConflictException('管理员用户名已存在');
  }

  private async hashPassword(password: string): Promise<string> {
    return hash(password, { type: argon2id });
  }

  private async flushUniqueConflict(operation: () => Promise<unknown>): Promise<void> {
    try {
      await operation();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException('管理员用户名已存在');
      }
      throw error;
    }
  }
}
