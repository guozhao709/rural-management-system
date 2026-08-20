import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { EntityManager, EntityRepository } from '@mikro-orm/core';
import { AccountStatus } from '../../common/enums/account-status.enum';
import { Admin, AdminRole } from '../admins/admin.entity';
import { User, UserGender } from '../users/user.entity';
import type { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';

describe('AuthService', () => {
  const users = { findOne: jest.fn() };
  const admins = { findOne: jest.fn() };
  const transactionUsers = { findOne: jest.fn() };
  const transactionAdmins = { findOne: jest.fn() };
  const transaction = {
    getRepository: jest.fn((entity: unknown) =>
      entity === User ? transactionUsers : transactionAdmins,
    ),
    flush: jest.fn(),
  };
  const entityManager = {
    flush: jest.fn(),
    transactional: jest.fn(),
  };
  const usersService = { create: jest.fn() };
  const passwordService = { verify: jest.fn() };
  const tokenService = new TokenService(
    new JwtService(),
    new ConfigService({
      auth: {
        accessSecret: 'auth-service-access-secret-at-least-32-characters',
        refreshSecret: 'auth-service-refresh-secret-at-least-32-characters',
        accessTtl: '15m',
        refreshTtl: '30d',
      },
    }),
  );
  let service: AuthService;

  const makeUser = (overrides: Partial<User> = {}): User =>
    Object.assign(new User(), {
      id: 1,
      phone: '13800000000',
      passwordHash: 'argon-hash',
      name: '张三',
      gender: UserGender.Unknown,
      birthday: null,
      address: null,
      status: AccountStatus.Active,
      deletedAt: null,
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
      lastLoginAt: null,
      ...overrides,
    });

  const makeAdmin = (overrides: Partial<Admin> = {}): Admin =>
    Object.assign(new Admin(), {
      id: 2,
      username: 'admin01',
      passwordHash: 'argon-hash',
      phone: null,
      role: AdminRole.Admin,
      status: AccountStatus.Active,
      deletedAt: null,
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
      lastLoginAt: null,
      ...overrides,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    entityManager.flush.mockResolvedValue(undefined);
    transaction.flush.mockResolvedValue(undefined);
    passwordService.verify.mockResolvedValue(true);

    let transactionTail = Promise.resolve();
    entityManager.transactional.mockImplementation(
      (callback: (manager: typeof transaction) => Promise<unknown>) => {
        const result = transactionTail.then(() => callback(transaction));
        transactionTail = result.then(
          () => undefined,
          () => undefined,
        );
        return result;
      },
    );

    service = new AuthService(
      users as unknown as EntityRepository<User>,
      admins as unknown as EntityRepository<Admin>,
      entityManager as unknown as EntityManager,
      usersService as unknown as UsersService,
      passwordService as unknown as PasswordService,
      tokenService,
    );
  });

  it('registers through UsersService, logs in immediately, and never returns credentials', async () => {
    const user = makeUser();
    usersService.create.mockResolvedValue({ id: user.id });
    users.findOne.mockResolvedValue(user);

    const result = await service.registerUser({
      phone: user.phone,
      password: 'example-password',
      name: user.name,
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ phone: user.phone, password: 'example-password' }),
    );
    expect(result.response.accessToken).toEqual(expect.any(String));
    expect(result.response.user).not.toHaveProperty('passwordHash');
    expect(result.response.user).not.toHaveProperty('refreshTokenHash');
    expect(user.refreshTokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('preserves registration phone conflicts from UsersService', async () => {
    usersService.create.mockRejectedValue(new ConflictException('用户手机号已存在'));
    await expect(
      service.registerUser({ phone: '13800000000', password: 'example-password', name: '张三' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('uses a uniform 401 for missing users and incorrect passwords', async () => {
    users.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(makeUser());
    passwordService.verify.mockResolvedValueOnce(false);

    await expect(
      service.loginUser({ phone: '13800000000', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.loginUser({ phone: '13800000000', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns 403 for disabled user and admin accounts', async () => {
    users.findOne.mockResolvedValue(makeUser({ status: AccountStatus.Disabled }));
    admins.findOne.mockResolvedValue(makeAdmin({ status: AccountStatus.Disabled }));

    await expect(
      service.loginUser({ phone: '13800000000', password: 'example-password' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.loginAdmin({ username: 'admin01', password: 'example-password' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('logs in admins with an isolated actor token and updates last_login_at', async () => {
    const admin = makeAdmin();
    admins.findOne.mockResolvedValue(admin);

    const result = await service.loginAdmin({
      username: admin.username,
      password: 'example-password',
    });

    await expect(
      tokenService.verifyAccess(result.response.accessToken, 'admin'),
    ).resolves.toMatchObject({
      sub: admin.id,
      actorType: 'admin',
    });
    expect(admin.lastLoginAt).toBeInstanceOf(Date);
  });

  it('rotates refresh tokens under a serialized pessimistic lock and rejects concurrent replay', async () => {
    const user = makeUser();
    users.findOne.mockResolvedValue(user);
    transactionUsers.findOne.mockResolvedValue(user);
    const login = await service.loginUser({
      phone: user.phone,
      password: 'example-password',
    });
    const original = login.refreshToken;

    const concurrent = await Promise.allSettled([
      service.refreshUser(original),
      service.refreshUser(original),
    ]);
    const successes = concurrent.filter((result) => result.status === 'fulfilled');
    const failures = concurrent.filter((result) => result.status === 'rejected');

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(transactionUsers.findOne).toHaveBeenCalledWith(
      { id: user.id, deletedAt: null },
      { lockMode: 'pessimistic_write' },
    );

    const rotated = successes[0];
    if (rotated?.status !== 'fulfilled') throw new Error('Expected one successful refresh');
    await expect(service.refreshUser(rotated.value.refreshToken)).resolves.toBeDefined();
    await expect(service.refreshUser(original)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects refresh tokens at the opposite actor endpoint', async () => {
    const tokens = await tokenService.issuePair(1, 'user');
    await expect(service.refreshAdmin(tokens.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('revokes refresh state on logout while existing access tokens remain structurally valid', async () => {
    const user = makeUser();
    users.findOne.mockResolvedValue(user);
    transactionUsers.findOne.mockResolvedValue(user);
    const login = await service.loginUser({ phone: user.phone, password: 'example-password' });

    await service.logoutUser(login.refreshToken);

    expect(user.refreshTokenHash).toBeNull();
    await expect(service.refreshUser(login.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      tokenService.verifyAccess(login.response.accessToken, 'user'),
    ).resolves.toBeDefined();
  });

  it('checks current account status and current admin role on every access request', async () => {
    const user = makeUser();
    const admin = makeAdmin();
    users.findOne.mockResolvedValue(user);
    admins.findOne.mockResolvedValue(admin);
    const userTokens = await tokenService.issuePair(user.id, 'user');
    const adminTokens = await tokenService.issuePair(admin.id, 'admin');

    await expect(service.authenticateUserAccess(userTokens.accessToken)).resolves.toBe(user);
    user.status = AccountStatus.Disabled;
    await expect(service.authenticateUserAccess(userTokens.accessToken)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    admin.role = AdminRole.SuperAdmin;
    await expect(service.authenticateAdminAccess(adminTokens.accessToken)).resolves.toMatchObject({
      role: AdminRole.SuperAdmin,
    });
  });
});
