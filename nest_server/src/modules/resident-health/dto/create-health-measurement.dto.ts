import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsObject, IsString, MaxLength } from 'class-validator';

export class CreateHealthMeasurementDto {
  @ApiProperty({
    enum: ['blood_pressure', 'body_temperature', 'heart_rate', 'body_weight', 'body_height'],
  })
  @IsString()
  @MaxLength(32)
  type!: string;

  @ApiProperty({ enum: ['self_reported', 'manual_device', 'connected_device'] })
  @IsIn(['self_reported', 'manual_device', 'connected_device'])
  source!: string;

  @ApiProperty({ example: '2026-08-25T08:00:00.000Z' })
  @IsISO8601()
  measuredAt!: string;

  @ApiProperty({ example: { value: 36.5, unit: 'celsius' } })
  @IsObject()
  values!: Record<string, unknown>;
}
