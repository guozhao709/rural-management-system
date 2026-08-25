import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
export class PageDto {
  @Type(() => Number) @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}
export class CropQueryDto extends PageDto {
  @IsOptional() @IsString() @MaxLength(100) keyword?: string;
}
export class CreateCropDto {
  @IsString() @MaxLength(64) code!: string;
  @IsString() @MaxLength(100) name!: string;
  @IsOptional() @IsString() @MaxLength(150) scientificName?: string;
}
export class UpdateCropDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(150) scientificName?: string;
  @IsOptional() @IsString() status?: 'active' | 'inactive';
}
export class CreateAliasDto {
  @IsString() @MaxLength(100) alias!: string;
}
export class KnowledgeQueryDto extends PageDto {
  @IsOptional() @IsString() @MaxLength(100) keyword?: string;
  @IsOptional() @Type(() => Number) @IsInt() cropId?: number;
  @IsOptional() @IsString() @MaxLength(32) category?: string;
  @IsOptional() @IsString() @MaxLength(64) tag?: string;
  @IsOptional() @IsString() @MaxLength(32) regionCode?: string;
}
export class CreateKnowledgeDto {
  @IsString() @MaxLength(255) title!: string;
  @IsOptional() @IsString() @MaxLength(500) summary?: string;
  @IsString() @MaxLength(20000) content!: string;
  @IsString() @MaxLength(32) category!: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) regionCodes?: string[];
  @IsOptional() @IsBoolean() isGeneral?: boolean;
  @IsOptional() @IsString() @MaxLength(255) sourceName?: string;
  @IsOptional() @IsUrl() @MaxLength(1000) sourceUrl?: string;
  @IsOptional() @IsString() validUntil?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsInt({ each: true }) cropIds?: number[];
}
export class UpdateKnowledgeDto extends CreateKnowledgeDto {}
export class FieldContextDto {
  @IsOptional() @IsString() @MaxLength(100) soilType?: string;
  @IsOptional() @IsBoolean() irrigationAvailable?: boolean;
}
export class CreateAnalysisDto {
  @IsInt() cropId!: number;
  @IsString() @MaxLength(32) regionCode!: string;
  @IsString() @MaxLength(255) regionName!: string;
  @IsOptional() @IsString() @MaxLength(64) growthStage?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) observations?: string[];
  @IsOptional() @ValidateNested() @Type(() => FieldContextDto) fieldContext?: FieldContextDto;
}
export class AnalysisQueryDto extends PageDto {
  @IsOptional() @Type(() => Number) @IsInt() cropId?: number;
  @IsOptional() @IsString() regionCode?: string;
  @IsOptional() @IsString() status?: string;
}
