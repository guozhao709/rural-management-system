import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../auth.types';
import type { AdminRole } from '../../admins/admin.entity';
import { REQUIRED_ADMIN_ROLES } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AdminRole[]>(REQUIRED_ADMIN_ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const admin = context.switchToHttp().getRequest<AuthenticatedRequest>().currentAdmin;
    if (!admin || !roles.includes(admin.role)) {
      throw new ForbiddenException('管理员角色权限不足');
    }
    return true;
  }
}
