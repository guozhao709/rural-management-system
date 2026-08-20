import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus } from '../../../common/enums/account-status.enum';
import { User, UserGender } from '../user.entity';

export class UserPresenter {
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

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  static from(entity: User): UserPresenter {
    return {
      id: entity.id,
      phone: entity.phone,
      name: entity.name,
      gender: entity.gender,
      birthday: entity.birthday,
      address: entity.address,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}

export class UserListPresenter {
  @ApiProperty({ type: [UserPresenter] })
  list!: UserPresenter[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
