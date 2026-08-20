import { SetMetadata } from '@nestjs/common';
import type { AdminRole } from '../../admins/admin.entity';

export const REQUIRED_ADMIN_ROLES = 'required-admin-roles';
export const Roles = (...roles: AdminRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRED_ADMIN_ROLES, roles);
