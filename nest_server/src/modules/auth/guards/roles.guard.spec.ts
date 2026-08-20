import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { Admin, AdminRole } from '../../admins/admin.entity';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new RolesGuard(reflector as unknown as Reflector);

  const contextFor = (role: AdminRole): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ currentAdmin: Object.assign(new Admin(), { role }) }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => jest.clearAllMocks());

  it('allows current database roles included by @Roles', () => {
    reflector.getAllAndOverride.mockReturnValue([AdminRole.Admin, AdminRole.SuperAdmin]);
    expect(guard.canActivate(contextFor(AdminRole.Admin))).toBe(true);
  });

  it('returns 403 when an authenticated admin lacks the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([AdminRole.SuperAdmin]);
    expect(() => guard.canActivate(contextFor(AdminRole.Admin))).toThrow(ForbiddenException);
  });
});
