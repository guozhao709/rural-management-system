import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus } from '../../../common/enums/account-status.enum';
import { Admin, AdminRole } from '../admin.entity';

export class AdminPresenter {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  username!: string;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiProperty({ enum: AdminRole })
  role!: AdminRole;

  @ApiProperty({ enum: AccountStatus })
  status!: AccountStatus;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  static from(entity: Admin): AdminPresenter {
    return {
      id: entity.id,
      username: entity.username,
      phone: entity.phone,
      role: entity.role,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}

export class AdminListPresenter {
  @ApiProperty({ type: [AdminPresenter] })
  list!: AdminPresenter[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
