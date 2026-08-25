import { Entity, Index, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { User } from '../../users/user.entity';
import { AnalysisStatus } from '../agriculture.enums';
import { Crop } from './crop.entity';
@Entity({ tableName: 'crop_analyses' })
@Index({ properties: ['user', 'createdAt'] })
export class CropAnalysis {
  @PrimaryKey({ type: 'bigint', autoincrement: true }) id!: string;
  @ManyToOne(() => User, { fieldName: 'user_id', deleteRule: 'restrict' }) user!: User;
  @ManyToOne(() => Crop, { fieldName: 'crop_id', deleteRule: 'restrict' }) crop!: Crop;
  @Property({ fieldName: 'crop_name_snapshot', type: 'string', length: 100 })
  cropNameSnapshot!: string;
  @Property({ fieldName: 'region_code', type: 'string', length: 32 }) regionCode!: string;
  @Property({ fieldName: 'region_name', type: 'string', length: 255 }) regionName!: string;
  @Property({ type: 'string', length: 16 }) status: AnalysisStatus = AnalysisStatus.Processing;
  @Property({ fieldName: 'input_snapshot', type: 'json' }) inputSnapshot!: Record<string, unknown>;
  @Property({ fieldName: 'context_snapshot', type: 'json' }) contextSnapshot!: Record<
    string,
    unknown
  >;
  @Property({ type: 'json', nullable: true }) result: Record<string, unknown> | null = null;
  @Property({ fieldName: 'schema_version', type: 'string', length: 16 }) schemaVersion = '1.0';
  @Property({ fieldName: 'prompt_version', type: 'string', length: 32 }) promptVersion = 'm08-v1';
  @Property({ fieldName: 'model_provider', type: 'string', length: 64, nullable: true })
  modelProvider: string | null = null;
  @Property({ fieldName: 'model_name', type: 'string', length: 128, nullable: true }) modelName:
    string | null = null;
  @Property({ fieldName: 'duration_ms', type: 'integer', nullable: true }) durationMs:
    number | null = null;
  @Property({ fieldName: 'error_code', type: 'string', length: 64, nullable: true }) errorCode:
    string | null = null;
  @Property({ fieldName: 'error_message', type: 'string', length: 255, nullable: true })
  errorMessage: string | null = null;
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() })
  createdAt = new Date();
  @Property({ fieldName: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null = null;
}
