import { IsIn } from 'class-validator';

export class QueryHealthTrendsDto {
  @IsIn(['blood_pressure', 'body_temperature', 'heart_rate', 'body_weight', 'body_height'])
  type!: string;

  @IsIn(['7d', '30d', '90d'])
  range!: string;
}
