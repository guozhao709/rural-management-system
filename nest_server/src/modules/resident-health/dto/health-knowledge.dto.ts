import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, IsUrl, MaxLength, Min } from 'class-validator';

export class CreateHealthKnowledgeDto {
  @IsString() @MaxLength(100) topic!: string;
  @IsString() @MaxLength(300) title!: string;
  @IsString() @MaxLength(20000) body!: string;
  @IsString() @MaxLength(300) sourceName!: string;
  @IsUrl() @MaxLength(2000) sourceUrl!: string;
}
export class UpdateHealthKnowledgeDto extends CreateHealthKnowledgeDto {}
export class PublishHealthKnowledgeDto {
  @IsDateString() reviewedAt!: string;
  @IsDateString() reviewDueAt!: string;
}
export class QueryHealthKnowledgeDto {
  @Type(() => Number) @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsInt() @Min(1) pageSize = 20;
  @IsOptional() @IsString() @MaxLength(100) status?: string;
}
