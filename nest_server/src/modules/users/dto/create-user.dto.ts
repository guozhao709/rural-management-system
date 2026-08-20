import { Transform } from 'class-transformer';
import {
  IsDateString,
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
import { IsNotFutureDate } from '../../../common/validators/is-not-future-date.validator';
import { UserGender } from '../user.entity';

const trimText = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateUserDto {
  @ApiProperty({ example: '13800000000' })
  @Transform(trimText)
  @IsString()
  @Length(6, 20)
  @Matches(/^\+?\d+$/)
  phone!: string;

  @ApiProperty({ minLength: 8, maxLength: 128, writeOnly: true })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: '张三', maxLength: 50 })
  @Transform(trimText)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @ApiProperty({ enum: UserGender, default: UserGender.Unknown })
  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender;

  @ApiPropertyOptional({ example: '2000-01-01', format: 'date', nullable: true })
  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  @IsNotFutureDate()
  birthday?: string | null;

  @ApiPropertyOptional({ example: '西安市', maxLength: 255, nullable: true })
  @Transform(trimText)
  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address?: string | null;

  @ApiProperty({ enum: AccountStatus, default: AccountStatus.Active })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}
