import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { AccountStatus } from '../../common/enums/account-status.enum';

export enum AdminRole {
  SuperAdmin = 'super_admin',
  Admin = 'admin',
}

@Entity({ tableName: 'admins' })
@Index({ name: 'idx_admins_created_at', properties: ['createdAt'] })
export class Admin {
  @PrimaryKey({ type: 'integer', autoincrement: true })
  id!: number;

  @Property({ type: 'string', length: 50, unique: true })
  username!: string;

  @Property({ fieldName: 'password_hash', type: 'string', length: 255, hidden: true })
  passwordHash!: string;

  @Property({ type: 'string', length: 20, nullable: true })
  phone: string | null = null;

  @Property({ type: 'string', length: 32 })
  role: AdminRole = AdminRole.Admin;

  @Property({ type: 'string', length: 16 })
  status: AccountStatus = AccountStatus.Active;

  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({
    fieldName: 'updated_at',
    type: 'timestamptz',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();

  @Property({ fieldName: 'deleted_at', type: 'timestamptz', nullable: true, hidden: true })
  deletedAt: Date | null = null;

  @Property({
    fieldName: 'refresh_token_hash',
    type: 'string',
    length: 64,
    nullable: true,
    hidden: true,
  })
  refreshTokenHash: string | null = null;

  @Property({
    fieldName: 'refresh_token_expires_at',
    type: 'timestamptz',
    nullable: true,
    hidden: true,
  })
  refreshTokenExpiresAt: Date | null = null;

  @Property({ fieldName: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null = null;
}
