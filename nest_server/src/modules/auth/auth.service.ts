import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityManager, LockMode } from '@mikro-orm/core';
import type { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { AccountStatus } from '../../common/enums/account-status.enum';
import { Admin } from '../admins/admin.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import type { AdminLoginDto } from './dto/admin-login.dto';
import type { UserLoginDto } from './dto/user-login.dto';
import type { UserRegisterDto } from './dto/user-register.dto';
import {
  AdminAuthResponsePresenter,
  AuthAdminPresenter,
  AuthUserPresenter,
  UserAuthResponsePresenter,
} from './presenters/auth.presenter';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import type { IssuedTokenPair } from './auth.types';

export interface UserSessionResult {
  response: UserAuthResponsePresenter;
  refreshToken: string;
  refreshExpiresAt: Date;
}

export interface AdminSessionResult {
  response: AdminAuthResponsePresenter;
  refreshToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: EntityRepository<User>,
    @InjectRepository(Admin)
    private readonly admins: EntityRepository<Admin>,
    private readonly entityManager: EntityManager,
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async registerUser(dto: UserRegisterDto): Promise<UserSessionResult> {
    const created = await this.usersService.create(dto);
    const user = await this.users.findOne({ id: created.id, deletedAt: null });
    if (!user) throw new UnauthorizedException('注册后的用户状态异常');
    return this.startUserSession(user);
  }

  async loginUser(dto: UserLoginDto): Promise<UserSessionResult> {
    const user = await this.users.findOne({ phone: dto.phone, deletedAt: null });
    if (!user || !(await this.verifyPassword(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('手机号或密码错误');
    }
    this.assertActive(user.status);
    return this.startUserSession(user);
  }

  async loginAdmin(dto: AdminLoginDto): Promise<AdminSessionResult> {
    const admin = await this.admins.findOne({ username: dto.username, deletedAt: null });
    if (!admin || !(await this.verifyPassword(admin.passwordHash, dto.password))) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    this.assertActive(admin.status);
    return this.startAdminSession(admin);
  }

  async refreshUser(refreshToken: string): Promise<UserSessionResult> {
    const payload = await this.tokenService.verifyRefresh(refreshToken, 'user');
    return this.entityManager.transactional(async (transaction) => {
      const user = await transaction
        .getRepository(User)
        .findOne({ id: payload.sub, deletedAt: null }, { lockMode: LockMode.PESSIMISTIC_WRITE });
      if (!user) throw new UnauthorizedException('Refresh Token 无效');
      this.assertActive(user.status);
      this.assertStoredRefreshToken(user, refreshToken);

      const tokens = await this.tokenService.issuePair(user.id, 'user');
      this.storeRefreshToken(user, tokens);
      await transaction.flush();
      return this.toUserSession(user, tokens);
    });
  }

  async refreshAdmin(refreshToken: string): Promise<AdminSessionResult> {
    const payload = await this.tokenService.verifyRefresh(refreshToken, 'admin');
    return this.entityManager.transactional(async (transaction) => {
      const admin = await transaction
        .getRepository(Admin)
        .findOne({ id: payload.sub, deletedAt: null }, { lockMode: LockMode.PESSIMISTIC_WRITE });
      if (!admin) throw new UnauthorizedException('Refresh Token 无效');
      this.assertActive(admin.status);
      this.assertStoredRefreshToken(admin, refreshToken);

      const tokens = await this.tokenService.issuePair(admin.id, 'admin');
      this.storeRefreshToken(admin, tokens);
      await transaction.flush();
      return this.toAdminSession(admin, tokens);
    });
  }

  async logoutUser(refreshToken: string | null): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = await this.tokenService.verifyRefresh(refreshToken, 'user');
      await this.entityManager.transactional(async (transaction) => {
        const user = await transaction
          .getRepository(User)
          .findOne({ id: payload.sub }, { lockMode: LockMode.PESSIMISTIC_WRITE });
        if (
          user?.refreshTokenHash &&
          this.tokenService.matchesRefreshToken(refreshToken, user.refreshTokenHash)
        ) {
          user.refreshTokenHash = null;
          user.refreshTokenExpiresAt = null;
          await transaction.flush();
        }
      });
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) throw error;
    }
  }

  async logoutAdmin(refreshToken: string | null): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = await this.tokenService.verifyRefresh(refreshToken, 'admin');
      await this.entityManager.transactional(async (transaction) => {
        const admin = await transaction
          .getRepository(Admin)
          .findOne({ id: payload.sub }, { lockMode: LockMode.PESSIMISTIC_WRITE });
        if (
          admin?.refreshTokenHash &&
          this.tokenService.matchesRefreshToken(refreshToken, admin.refreshTokenHash)
        ) {
          admin.refreshTokenHash = null;
          admin.refreshTokenExpiresAt = null;
          await transaction.flush();
        }
      });
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) throw error;
    }
  }

  async authenticateUserAccess(accessToken: string): Promise<User> {
    const payload = await this.tokenService.verifyAccess(accessToken, 'user');
    const user = await this.users.findOne({ id: payload.sub, deletedAt: null }, { refresh: true });
    if (!user) throw new UnauthorizedException('用户认证状态无效');
    this.assertActive(user.status);
    return user;
  }

  async authenticateAdminAccess(accessToken: string): Promise<Admin> {
    const payload = await this.tokenService.verifyAccess(accessToken, 'admin');
    const admin = await this.admins.findOne(
      { id: payload.sub, deletedAt: null },
      { refresh: true },
    );
    if (!admin) throw new UnauthorizedException('管理员认证状态无效');
    this.assertActive(admin.status);
    return admin;
  }

  private async startUserSession(user: User): Promise<UserSessionResult> {
    const tokens = await this.tokenService.issuePair(user.id, 'user');
    this.storeRefreshToken(user, tokens);
    user.lastLoginAt = new Date();
    await this.entityManager.flush();
    return this.toUserSession(user, tokens);
  }

  private async startAdminSession(admin: Admin): Promise<AdminSessionResult> {
    const tokens = await this.tokenService.issuePair(admin.id, 'admin');
    this.storeRefreshToken(admin, tokens);
    admin.lastLoginAt = new Date();
    await this.entityManager.flush();
    return this.toAdminSession(admin, tokens);
  }

  private storeRefreshToken(account: User | Admin, tokens: IssuedTokenPair): void {
    account.refreshTokenHash = this.tokenService.hashRefreshToken(tokens.refreshToken);
    account.refreshTokenExpiresAt = tokens.refreshExpiresAt;
  }

  private assertStoredRefreshToken(account: User | Admin, refreshToken: string): void {
    if (
      !account.refreshTokenHash ||
      !account.refreshTokenExpiresAt ||
      account.refreshTokenExpiresAt.getTime() <= Date.now() ||
      !this.tokenService.matchesRefreshToken(refreshToken, account.refreshTokenHash)
    ) {
      throw new UnauthorizedException('Refresh Token 无效');
    }
  }

  private assertActive(status: AccountStatus): void {
    if (status !== AccountStatus.Active) throw new ForbiddenException('账户已被禁用');
  }

  private async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await this.passwordService.verify(hash, password);
    } catch {
      return false;
    }
  }

  private toUserSession(user: User, tokens: IssuedTokenPair): UserSessionResult {
    return {
      response: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.accessExpiresIn,
        user: AuthUserPresenter.from(user),
      },
      refreshToken: tokens.refreshToken,
      refreshExpiresAt: tokens.refreshExpiresAt,
    };
  }

  private toAdminSession(admin: Admin, tokens: IssuedTokenPair): AdminSessionResult {
    return {
      response: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.accessExpiresIn,
        admin: AuthAdminPresenter.from(admin),
      },
      refreshToken: tokens.refreshToken,
      refreshExpiresAt: tokens.refreshExpiresAt,
    };
  }
}
