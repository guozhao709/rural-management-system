import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { EntityManager, EntityRepository } from '@mikro-orm/core';
import { verify } from 'argon2';
import { AccountStatus } from '../../common/enums/account-status.enum';
import { User, UserGender } from './user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const users = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    assign: jest.fn(),
  };
  const entityManager = { flush: jest.fn() };
  const healthLifecycle = { purgeForUser: jest.fn() };
  let service: UsersService;

  const makeUser = (overrides: Partial<User> = {}): User =>
    Object.assign(new User(), {
      id: 1,
      phone: '13800000000',
      passwordHash: 'old-hash',
      name: '张三',
      gender: UserGender.Male,
      birthday: '2000-01-01',
      address: '西安市',
      status: AccountStatus.Active,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      deletedAt: null,
      ...overrides,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    users.create.mockImplementation((data: Partial<User>) => makeUser(data));
    users.assign.mockImplementation((entity: User, data: Partial<User>) =>
      Object.assign(entity, data),
    );
    entityManager.flush.mockResolvedValue(undefined);
    healthLifecycle.purgeForUser.mockResolvedValue(undefined);
    service = new UsersService(
      users as unknown as EntityRepository<User>,
      entityManager as unknown as EntityManager,
      healthLifecycle as unknown as import('../resident-health/health-data-lifecycle.service').HealthDataLifecycleService,
    );
  });

  it('creates a user with Argon2id and never presents the hash', async () => {
    users.findOne.mockResolvedValue(null);

    const result = await service.create({
      phone: '13800000000',
      password: 'example-password',
      name: '张三',
      gender: UserGender.Male,
      birthday: '2000-01-01',
      address: '西安市',
      status: AccountStatus.Active,
    });
    const created = users.create.mock.results[0]?.value as User;

    expect(await verify(created.passwordHash, 'example-password')).toBe(true);
    expect(created.passwordHash.startsWith('$argon2id$')).toBe(true);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicate phone numbers', async () => {
    users.findOne.mockResolvedValue(makeUser());

    await expect(
      service.create({
        phone: '13800000000',
        password: 'example-password',
        name: '张三',
        gender: UserGender.Unknown,
        status: AccountStatus.Active,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('paginates and builds keyword search over name and phone', async () => {
    users.findAndCount.mockResolvedValue([[makeUser()], 1]);

    await expect(service.findAll({ page: 1, pageSize: 15, keyword: '张' })).resolves.toMatchObject({
      total: 1,
      page: 1,
      pageSize: 15,
    });
    expect(users.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedAt: null,
        $or: [{ name: { $ilike: '%张%' } }, { phone: { $ilike: '%张%' } }],
      }),
      expect.objectContaining({ limit: 15, offset: 0 }),
    );
  });

  it('returns details and maps missing or deleted users to 404', async () => {
    users.findOne.mockResolvedValueOnce(makeUser()).mockResolvedValueOnce(null);

    await expect(service.findOne(1)).resolves.toMatchObject({ id: 1, name: '张三' });
    await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('patches fields, changes password, and rejects a conflicting phone', async () => {
    const user = makeUser();
    users.findOne.mockResolvedValueOnce(user);

    const result = await service.update(1, { password: 'new-password', address: null });

    expect(await verify(user.passwordHash, 'new-password')).toBe(true);
    expect(user.address).toBeNull();
    expect(result).not.toHaveProperty('passwordHash');

    users.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(makeUser({ id: 2 }));
    await expect(service.update(1, { phone: '13900000000' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects an empty patch', async () => {
    await expect(service.update(1, {})).rejects.toBeInstanceOf(BadRequestException);
    expect(users.findOne).not.toHaveBeenCalled();
  });

  it('soft deletes and excludes the record from later detail lookup', async () => {
    const user = makeUser();
    users.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(null);

    await service.remove(1);

    expect(user.deletedAt).toBeInstanceOf(Date);
    expect(healthLifecycle.purgeForUser).toHaveBeenCalledWith(1);
    await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
  });
});
