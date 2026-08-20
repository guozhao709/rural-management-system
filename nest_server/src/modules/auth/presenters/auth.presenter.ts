import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus } from '../../../common/enums/account-status.enum';
import { Admin, AdminRole } from '../../admins/admin.entity';
import { User, UserGender } from '../../users/user.entity';

export class AuthUserPresenter {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: UserGender })
  gender!: UserGender;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  birthday!: string | null;

  @ApiPropertyOptional({ nullable: true })
  address!: string | null;

  @ApiProperty({ enum: AccountStatus })
  status!: AccountStatus;

  static from(user: User): AuthUserPresenter {
    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      gender: user.gender,
      birthday: user.birthday,
      address: user.address,
      status: user.status,
    };
  }
}

export class AuthAdminPresenter {
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

  static from(admin: Admin): AuthAdminPresenter {
    return {
      id: admin.id,
      username: admin.username,
      phone: admin.phone,
      role: admin.role,
      status: admin.status,
    };
  }
}

export class UserAuthResponsePresenter {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: 900 })
  expiresIn!: number;

  @ApiProperty({ type: AuthUserPresenter })
  user!: AuthUserPresenter;
}

export class AdminAuthResponsePresenter {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: 900 })
  expiresIn!: number;

  @ApiProperty({ type: AuthAdminPresenter })
  admin!: AuthAdminPresenter;
}
