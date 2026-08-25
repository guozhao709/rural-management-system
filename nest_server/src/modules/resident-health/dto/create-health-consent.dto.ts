import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsString, MaxLength } from 'class-validator';
import { HEALTH_CONSENT_SCOPES } from '../resident-health.types';

export class CreateHealthConsentDto {
  @ApiProperty({ example: '1.0' })
  @IsString()
  @MaxLength(100)
  noticeVersion!: string;

  @ApiProperty({ enum: HEALTH_CONSENT_SCOPES, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @IsIn(HEALTH_CONSENT_SCOPES, { each: true })
  scopes!: string[];
}
