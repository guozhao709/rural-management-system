import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus } from '../../../common/enums/account-status.enum';
import { AdminRole } from '../admin.entity';

const trimText = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateAdminDto {
  @ApiProperty({ example: 'admin01', minLength: 1, maxLength: 50 })
  @Transform(trimText)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username!: string;

  @ApiProperty({ minLength: 8, maxLength: 128, writeOnly: true })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({ example: '13800000000', nullable: true })
  @Transform(trimText)
  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsString()
  @Length(6, 20)
  @Matches(/^\+?\d+$/)
  phone?: string | null;

  @ApiProperty({ enum: AdminRole, default: AdminRole.Admin })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @ApiProperty({ enum: AccountStatus, default: AccountStatus.Active })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}
