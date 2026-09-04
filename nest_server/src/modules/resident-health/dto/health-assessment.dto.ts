import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

class HealthSymptomDto {
  @IsIn(['chest_discomfort', 'difficulty_breathing', 'loss_of_consciousness', 'seizure', 'fever', 'cough', 'fatigue', 'dizziness', 'headache', 'other']) code!: string;
  @IsIn(['mild', 'moderate', 'severe']) severity!: string;
  @IsISO8601() startedAt!: string;
  @IsIn(['new', 'intermittent', 'persistent']) course!: string;
}
export class CreateHealthAssessmentDto {
  @IsString() @MaxLength(128) idempotencyKey!: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => HealthSymptomDto) symptoms!: HealthSymptomDto[];
  @IsOptional() @IsString() @MaxLength(1000) otherDetails?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) measurementIds?: string[];
}
export class QueryHealthAssessmentsDto {
  @Type(() => Number) @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @IsIn(['emergency', 'urgent', 'routine', 'self_care', 'insufficient']) triageLevel?: string;
}
