import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { EntityManager, EntityRepository } from '@mikro-orm/core';
import { verify } from 'argon2';
import { AccountStatus } from '../../common/enums/account-status.enum';
import { Admin, AdminRole } from './admin.entity';
import { AdminsService } from './admins.service';

describe('AdminsService', () => {
  const admins = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    assign: jest.fn(),
  };
  const entityManager = { flush: jest.fn() };
  let service: AdminsService;

  const makeAdmin = (overrides: Partial<Admin> = {}): Admin =>
    Object.assign(new Admin(), {
      id: 1,
      username: 'admin01',
      passwordHash: 'old-hash',
      phone: '13800000000',
      role: AdminRole.Admin,
      status: AccountStatus.Active,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      deletedAt: null,
      ...overrides,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    admins.create.mockImplementation((data: Partial<Admin>) => makeAdmin(data));
    admins.assign.mockImplementation((entity: Admin, data: Partial<Admin>) =>
      Object.assign(entity, data),
    );
    entityManager.flush.mockResolvedValue(undefined);
    service = new AdminsService(
      admins as unknown as EntityRepository<Admin>,
      entityManager as unknown as EntityManager,
    );
  });

  it('creates an admin with Argon2id and never presents the hash', async () => {
    admins.findOne.mockResolvedValue(null);

    const result = await service.create({
      username: 'admin01',
      password: 'example-password',
      phone: '13800000000',
      role: AdminRole.Admin,
      status: AccountStatus.Active,
    });
    const created = admins.create.mock.results[0]?.value as Admin;

    expect(await verify(created.passwordHash, 'example-password')).toBe(true);
    expect(created.passwordHash.startsWith('$argon2id$')).toBe(true);
    expect(result).not.toHaveProperty('passwordHash');
    expect(entityManager.flush).toHaveBeenCalledTimes(1);
  });

  it('rejects duplicate usernames', async () => {
    admins.findOne.mockResolvedValue(makeAdmin());

    await expect(
      service.create({
        username: 'admin01',
        password: 'example-password',
        role: AdminRole.Admin,
        status: AccountStatus.Active,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns a paginated list ordered by creation time', async () => {
    admins.findAndCount.mockResolvedValue([[makeAdmin()], 16]);

    await expect(
      service.findAll({ page: 2, pageSize: 15, keyword: 'admin', role: AdminRole.Admin }),
    ).resolves.toMatchObject({ total: 16, page: 2, pageSize: 15 });
    expect(admins.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ deletedAt: null, role: AdminRole.Admin }),
      expect.objectContaining({ limit: 15, offset: 15 }),
    );
  });

  it('returns details and maps missing or deleted admins to 404', async () => {
    admins.findOne.mockResolvedValueOnce(makeAdmin()).mockResolvedValueOnce(null);

    await expect(service.findOne(1)).resolves.toMatchObject({ id: 1, username: 'admin01' });
    await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('patches only supplied fields and changes the password hash', async () => {
    const admin = makeAdmin();
    admins.findOne.mockResolvedValue(admin);

    const result = await service.update(1, { password: 'new-password', phone: null });

    expect(await verify(admin.passwordHash, 'new-password')).toBe(true);
    expect(admin.phone).toBeNull();
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects an empty patch', async () => {
    await expect(service.update(1, {})).rejects.toBeInstanceOf(BadRequestException);
    expect(admins.findOne).not.toHaveBeenCalled();
  });

  it('soft deletes and excludes the record from later detail lookup', async () => {
    const admin = makeAdmin();
    admins.findOne.mockResolvedValueOnce(admin).mockResolvedValueOnce(null);

    await service.remove(1);

    expect(admin.deletedAt).toBeInstanceOf(Date);
    await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
  });
});
