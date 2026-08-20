import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/app.setup';
import { AccountStatus } from '../src/common/enums/account-status.enum';
import { Admin, AdminRole } from '../src/modules/admins/admin.entity';
import { AdminsService } from '../src/modules/admins/admins.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { User, UserGender } from '../src/modules/users/user.entity';
import { UsersService } from '../src/modules/users/users.service';

describe('Application (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  const admin = {
    id: 1,
    username: 'admin01',
    phone: '13800000000',
    role: AdminRole.Admin,
    status: AccountStatus.Active,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const user = {
    id: 1,
    phone: '13900000000',
    name: '张三',
    gender: UserGender.Male,
    birthday: '2000-01-01',
    address: '西安市',
    status: AccountStatus.Active,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const adminsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const usersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const authenticatedAdmin = Object.assign(new Admin(), {
    id: 99,
    username: 'root',
    role: AdminRole.SuperAdmin,
    status: AccountStatus.Active,
  });
  const authenticatedUser = Object.assign(new User(), {
    ...user,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
  });
  const refreshExpiresAt = new Date('2099-01-01T00:00:00.000Z');
  const authService = {
    registerUser: jest.fn(),
    loginUser: jest.fn(),
    loginAdmin: jest.fn(),
    refreshUser: jest.fn(),
    refreshAdmin: jest.fn(),
    logoutUser: jest.fn(),
    logoutAdmin: jest.fn(),
    authenticateUserAccess: jest.fn(),
    authenticateAdminAccess: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(Admin))
      .useValue({})
      .overrideProvider(getRepositoryToken(User))
      .useValue({})
      .overrideProvider(AdminsService)
      .useValue(adminsService)
      .overrideProvider(UsersService)
      .useValue(usersService)
      .overrideProvider(AuthService)
      .useValue(authService)
      .compile();

    app = moduleFixture.createNestApplication({ bufferLogs: true });
    configureApplication(app);
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    adminsService.create.mockResolvedValue(admin);
    adminsService.findAll.mockResolvedValue({ list: [admin], total: 1, page: 1, pageSize: 15 });
    adminsService.findOne.mockResolvedValue(admin);
    adminsService.update.mockResolvedValue({ ...admin, phone: null });
    adminsService.remove.mockResolvedValue(undefined);
    usersService.create.mockResolvedValue(user);
    usersService.findAll.mockResolvedValue({ list: [user], total: 1, page: 1, pageSize: 15 });
    usersService.findOne.mockResolvedValue(user);
    usersService.update.mockResolvedValue({ ...user, address: null });
    usersService.remove.mockResolvedValue(undefined);
    const userSession = {
      response: { accessToken: 'user-access-token', expiresIn: 900, user },
      refreshToken: 'user-refresh-token',
      refreshExpiresAt,
    };
    const adminSession = {
      response: { accessToken: 'admin-access-token', expiresIn: 900, admin },
      refreshToken: 'admin-refresh-token',
      refreshExpiresAt,
    };
    authService.registerUser.mockResolvedValue(userSession);
    authService.loginUser.mockResolvedValue(userSession);
    authService.refreshUser.mockResolvedValue({
      ...userSession,
      refreshToken: 'rotated-user-refresh-token',
    });
    authService.loginAdmin.mockResolvedValue(adminSession);
    authService.refreshAdmin.mockResolvedValue({
      ...adminSession,
      refreshToken: 'rotated-admin-refresh-token',
    });
    authService.logoutUser.mockResolvedValue(undefined);
    authService.logoutAdmin.mockResolvedValue(undefined);
    authService.authenticateUserAccess.mockImplementation((token: string) => {
      if (token !== 'user-token') throw new UnauthorizedException('认证凭证无效');
      return Promise.resolve(authenticatedUser);
    });
    authService.authenticateAdminAccess.mockImplementation((token: string) => {
      if (token === 'admin-token') return Promise.resolve(authenticatedAdmin);
      if (token === 'normal-admin-token') {
        return Promise.resolve(
          Object.assign(new Admin(), authenticatedAdmin, { role: AdminRole.Admin }),
        );
      }
      throw new UnauthorizedException('认证凭证无效');
    });
  });

  it('GET /health returns the standard success envelope', async () => {
    await request(httpServer)
      .get('/health')
      .expect(200)
      .expect({
        code: 200,
        message: '服务正常',
        data: { status: 'ok' },
      });
  });

  it('GET /api/docs exposes Swagger outside production', async () => {
    const response = await request(httpServer).get('/api/docs').expect(200);

    expect(response.text).toContain('Swagger UI');

    const document = await request(httpServer).get('/api/docs-json').expect(200);
    const body = document.body as unknown as {
      components: { securitySchemes: Record<string, unknown> };
    };
    expect(body.components.securitySchemes).toHaveProperty('bearer');
    expect(body.components.securitySchemes).toHaveProperty('zhixiangyun_user_refresh');
    expect(body.components.securitySchemes).toHaveProperty('zhixiangyun_admin_refresh');
  });

  it('returns the standard error envelope for unknown routes', async () => {
    const response = await request(httpServer).get('/missing').expect(404);

    expect(response.body).toEqual({
      code: 404,
      message: 'Cannot GET /missing',
      data: null,
    });
  });

  it('POST /api/v2/admin/admins validates, trims, wraps, and hides password data', async () => {
    const response = await request(httpServer)
      .post('/api/v2/admin/admins')
      .set('Authorization', 'Bearer admin-token')
      .send({ username: ' admin01 ', password: 'example-password', role: 'admin' })
      .expect(201);

    expect(adminsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'admin01', password: 'example-password' }),
    );
    const body = response.body as unknown as { data: typeof admin };
    expect(body.data).toEqual(admin);
    expect(body.data).not.toHaveProperty('password');
    expect(body.data).not.toHaveProperty('passwordHash');
  });

  it('maps duplicate admins to 409 and missing admins to 404', async () => {
    adminsService.create.mockRejectedValueOnce(new ConflictException('管理员用户名已存在'));
    await request(httpServer)
      .post('/api/v2/admin/admins')
      .set('Authorization', 'Bearer admin-token')
      .send({ username: 'admin01', password: 'example-password' })
      .expect(409);

    adminsService.findOne.mockRejectedValueOnce(new NotFoundException('管理员不存在'));
    await request(httpServer)
      .get('/api/v2/admin/admins/99')
      .set('Authorization', 'Bearer admin-token')
      .expect(404);
  });

  it('supports admin list, partial update, and soft-delete endpoints', async () => {
    await request(httpServer)
      .get('/api/v2/admin/admins?page=1&pageSize=15&keyword=admin')
      .set('Authorization', 'Bearer admin-token')
      .expect(200);
    expect(adminsService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 15, keyword: 'admin' }),
    );

    await request(httpServer)
      .patch('/api/v2/admin/admins/1')
      .set('Authorization', 'Bearer admin-token')
      .send({ phone: null })
      .expect(200);
    expect(adminsService.update).toHaveBeenCalledWith(1, expect.objectContaining({ phone: null }));

    await request(httpServer)
      .delete('/api/v2/admin/admins/1')
      .set('Authorization', 'Bearer admin-token')
      .expect(204);
    expect(adminsService.remove).toHaveBeenCalledWith(1);
  });

  it('POST /api/v2/admin/users exposes the user presenter without password data', async () => {
    const response = await request(httpServer)
      .post('/api/v2/admin/users')
      .set('Authorization', 'Bearer admin-token')
      .send({
        phone: '13900000000',
        password: 'example-password',
        name: ' 张三 ',
        gender: 'male',
        birthday: '2000-01-01',
      })
      .expect(201);

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: '张三', password: 'example-password' }),
    );
    const body = response.body as unknown as { data: typeof user };
    expect(body.data).toEqual(user);
    expect(body.data).not.toHaveProperty('passwordHash');
  });

  it('supports user keyword listing, detail, patch, conflicts, and delete', async () => {
    await request(httpServer)
      .get('/api/v2/admin/users?keyword=%E5%BC%A0&page=1&pageSize=15')
      .set('Authorization', 'Bearer admin-token')
      .expect(200);
    expect(usersService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: '张', page: 1, pageSize: 15 }),
    );

    await request(httpServer)
      .get('/api/v2/admin/users/1')
      .set('Authorization', 'Bearer admin-token')
      .expect(200);
    await request(httpServer)
      .patch('/api/v2/admin/users/1')
      .set('Authorization', 'Bearer admin-token')
      .send({ address: null })
      .expect(200);

    usersService.update.mockRejectedValueOnce(new ConflictException('用户手机号已存在'));
    await request(httpServer)
      .patch('/api/v2/admin/users/1')
      .set('Authorization', 'Bearer admin-token')
      .send({ phone: '13800000000' })
      .expect(409);

    await request(httpServer)
      .delete('/api/v2/admin/users/1')
      .set('Authorization', 'Bearer admin-token')
      .expect(204);
    expect(usersService.remove).toHaveBeenCalledWith(1);
  });

  it('rejects empty PATCH bodies and future birthdays through validation/service rules', async () => {
    adminsService.update.mockRejectedValueOnce(new BadRequestException('至少提供一个可修改字段'));
    await request(httpServer)
      .patch('/api/v2/admin/admins/1')
      .set('Authorization', 'Bearer admin-token')
      .send({})
      .expect(400);
    expect(adminsService.update).toHaveBeenCalledWith(1, {});

    await request(httpServer)
      .post('/api/v2/admin/users')
      .set('Authorization', 'Bearer admin-token')
      .send({
        phone: '13900000000',
        password: 'example-password',
        name: '张三',
        birthday: '2999-01-01',
      })
      .expect(400);
  });

  it('registers and logs in users with an HttpOnly refresh cookie outside JSON', async () => {
    const response = await request(httpServer)
      .post('/api/v2/auth/user/register')
      .send({ phone: '13900000000', password: 'example-password', name: '张三' })
      .expect(201);
    const cookies = response.headers['set-cookie'] as unknown as string[];
    const body = response.body as unknown as { data: Record<string, unknown> };

    expect(cookies[0]).toContain('zhixiangyun_user_refresh=user-refresh-token');
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('SameSite=Lax');
    expect(cookies[0]).not.toContain('Secure');
    expect(body.data).not.toHaveProperty('refreshToken');

    await request(httpServer)
      .post('/api/v2/auth/user/login')
      .send({ phone: '13900000000', password: 'example-password' })
      .expect(200);
  });

  it('rotates refresh cookies, clears them on logout, and rejects a missing cookie', async () => {
    await request(httpServer).post('/api/v2/auth/user/refresh').expect(401);

    const agent = request.agent(httpServer);
    await agent
      .post('/api/v2/auth/user/login')
      .send({ phone: '13900000000', password: 'example-password' })
      .expect(200);
    const refreshed = await agent.post('/api/v2/auth/user/refresh').expect(200);
    const refreshedCookies = refreshed.headers['set-cookie'] as unknown as string[];
    expect(refreshedCookies[0]).toContain('rotated-user-refresh-token');

    const logout = await agent.post('/api/v2/auth/user/logout').expect(204);
    const clearedCookies = logout.headers['set-cookie'] as unknown as string[];
    expect(clearedCookies[0]).toContain('Expires=Thu, 01 Jan 1970');
    expect(authService.logoutUser).toHaveBeenCalledWith('rotated-user-refresh-token');
  });

  it('supports admin login with a separate refresh cookie', async () => {
    const response = await request(httpServer)
      .post('/api/v2/auth/admin/login')
      .send({ username: 'admin01', password: 'example-password' })
      .expect(200);
    const cookies = response.headers['set-cookie'] as unknown as string[];

    expect(cookies[0]).toContain('zhixiangyun_admin_refresh=admin-refresh-token');
    expect(cookies[0]).toContain('HttpOnly');
  });

  it('enforces access identity and current database roles on protected APIs', async () => {
    await request(httpServer).get('/api/v2/admin/admins').expect(401);
    await request(httpServer)
      .get('/api/v2/admin/admins')
      .set('Authorization', 'Bearer user-token')
      .expect(401);
    await request(httpServer)
      .get('/api/v2/admin/admins')
      .set('Authorization', 'Bearer normal-admin-token')
      .expect(403);
    await request(httpServer)
      .get('/api/v2/admin/users')
      .set('Authorization', 'Bearer normal-admin-token')
      .expect(200);
    await request(httpServer)
      .get('/api/v2/admin/admins')
      .set('Authorization', 'Bearer admin-token')
      .expect(200);
  });

  it('exposes /me only through the matching Access Guard', async () => {
    await request(httpServer).get('/api/v2/auth/user/me').expect(401);
    await request(httpServer)
      .get('/api/v2/auth/user/me')
      .set('Authorization', 'Bearer user-token')
      .expect(200);
    await request(httpServer)
      .get('/api/v2/auth/admin/me')
      .set('Authorization', 'Bearer admin-token')
      .expect(200);
    await request(httpServer)
      .get('/api/v2/auth/admin/me')
      .set('Authorization', 'Bearer user-token')
      .expect(401);
  });
});
