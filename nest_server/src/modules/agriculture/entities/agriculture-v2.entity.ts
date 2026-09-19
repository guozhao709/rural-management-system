import { randomUUID } from 'node:crypto';
import { Collection } from '@mikro-orm/core';
import {
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { User } from '../../users/user.entity';
import { Crop } from './crop.entity';

const newId = (): string => randomUUID();

@Entity({ tableName: 'agriculture_lands' })
@Index({ properties: ['user'] })
@Index({ properties: ['user', 'createdAt'] })
export class AgricultureLand {
  @PrimaryKey({ type: 'uuid' }) id: string = newId();
  @ManyToOne(() => User, { fieldName: 'user_id', deleteRule: 'restrict' }) user!: User;
  @Property({ type: 'string', length: 100 }) name!: string;
  @Property({ type: 'string', length: 50 }) province!: string;
  @Property({ type: 'string', length: 50 }) city!: string;
  @Property({ type: 'string', length: 50 }) district!: string;
  @Property({ fieldName: 'planting_environment', type: 'string', length: 32 })
  plantingEnvironment!: string;
  @Property({ fieldName: 'area_value', type: 'decimal', precision: 12, scale: 2, nullable: true })
  areaValue: string | null = null;
  @Property({ fieldName: 'area_unit', type: 'string', length: 16, nullable: true })
  areaUnit: string | null = null;
  @Property({ type: 'string', length: 100, nullable: true }) soil: string | null = null;
  @Property({ type: 'string', length: 32, nullable: true }) irrigation: string | null = null;
  @Property({ type: 'string', length: 32, nullable: true }) drainage: string | null = null;
  @Property({ type: 'text', nullable: true }) description: string | null = null;
  @OneToMany(() => AgriculturePlanting, (planting) => planting.land)
  plantings = new Collection<AgriculturePlanting>(this);
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() })
  createdAt = new Date();
  @Property({ fieldName: 'updated_at', type: 'timestamptz', onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt = new Date();
}

@Entity({ tableName: 'agriculture_plantings' })
@Index({ properties: ['land'] })
@Index({ properties: ['crop'] })
@Index({ properties: ['land', 'status'] })
export class AgriculturePlanting {
  @PrimaryKey({ type: 'uuid' }) id: string = newId();
  @ManyToOne(() => AgricultureLand, { fieldName: 'land_id', deleteRule: 'restrict' }) land!: AgricultureLand;
  @ManyToOne(() => Crop, { fieldName: 'crop_id', deleteRule: 'restrict' }) crop!: Crop;
  @Property({ type: 'string', length: 100, nullable: true }) variety: string | null = null;
  @Property({ fieldName: 'planting_date', type: 'date', nullable: true }) plantingDate: string | null = null;
  @Property({ fieldName: 'planting_time_text', type: 'string', length: 100, nullable: true })
  plantingTimeText: string | null = null;
  @Property({ fieldName: 'growth_stage', type: 'string', length: 100, nullable: true })
  growthStage: string | null = null;
  @Property({ type: 'string', length: 32 }) status = 'planned';
  @Property({ type: 'text', nullable: true }) description: string | null = null;
  @OneToMany(() => AgricultureGrowthMetric, (metric) => metric.planting)
  metrics = new Collection<AgricultureGrowthMetric>(this);
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() })
  createdAt = new Date();
  @Property({ fieldName: 'updated_at', type: 'timestamptz', onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt = new Date();
}

@Entity({ tableName: 'agriculture_growth_metrics' })
@Unique({ properties: ['planting', 'name'] })
@Index({ properties: ['planting'] })
export class AgricultureGrowthMetric {
  @PrimaryKey({ type: 'uuid' }) id: string = newId();
  @ManyToOne(() => AgriculturePlanting, { fieldName: 'planting_id', deleteRule: 'restrict' })
  planting!: AgriculturePlanting;
  @Property({ type: 'string', length: 100 }) name!: string;
  @Property({ type: 'string', length: 32 }) unit!: string;
  @OneToMany(() => AgricultureGrowthMetricRecord, (record) => record.metric)
  records = new Collection<AgricultureGrowthMetricRecord>(this);
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() })
  createdAt = new Date();
  @Property({ fieldName: 'updated_at', type: 'timestamptz', onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt = new Date();
}

@Entity({ tableName: 'agriculture_growth_metric_records' })
@Index({ properties: ['metric', 'recordedAt'] })
export class AgricultureGrowthMetricRecord {
  @PrimaryKey({ type: 'uuid' }) id: string = newId();
  @ManyToOne(() => AgricultureGrowthMetric, { fieldName: 'metric_id', deleteRule: 'restrict' })
  metric!: AgricultureGrowthMetric;
  @Property({ type: 'decimal', precision: 14, scale: 4 }) value!: string;
  @Property({ fieldName: 'recorded_at', type: 'timestamptz' }) recordedAt!: Date;
  @Property({ type: 'text', nullable: true }) note: string | null = null;
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() })
  createdAt = new Date();
}

@Entity({ tableName: 'agriculture_planting_evaluations' })
@Index({ properties: ['land', 'createdAt'] })
@Index({ properties: ['crop'] })
@Index({ properties: ['suitability'] })
export class AgriculturePlantingEvaluation {
  @PrimaryKey({ type: 'uuid' }) id: string = newId();
  @ManyToOne(() => AgricultureLand, { fieldName: 'land_id', deleteRule: 'restrict' }) land!: AgricultureLand;
  @ManyToOne(() => Crop, { fieldName: 'crop_id', nullable: true, deleteRule: 'restrict' }) crop: Crop | null = null;
  @Property({ fieldName: 'crop_name', type: 'string', length: 100 }) cropName!: string;
  @Property({ type: 'string', length: 100, nullable: true }) variety: string | null = null;
  @Property({ fieldName: 'planned_planting_time', type: 'string', length: 100, nullable: true })
  plannedPlantingTime: string | null = null;
  @Property({ type: 'text' }) summary!: string;
  @Property({ type: 'string', length: 32 }) suitability!: string;
  @Property({ fieldName: 'schema_version', type: 'smallint', default: 1 }) schemaVersion = 1;
  @Property({ fieldName: 'input_snapshot', type: 'json' }) inputSnapshot!: Record<string, unknown>;
  @Property({ fieldName: 'result_snapshot', type: 'json' }) resultSnapshot!: Record<string, unknown>;
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() })
  createdAt = new Date();
}

@Entity({ tableName: 'agriculture_growth_analyses' })
@Index({ properties: ['planting', 'createdAt'] })
@Index({ properties: ['growthStatus'] })
export class AgricultureGrowthAnalysis {
  @PrimaryKey({ type: 'uuid' }) id: string = newId();
  @ManyToOne(() => AgriculturePlanting, { fieldName: 'planting_id', deleteRule: 'restrict' })
  planting!: AgriculturePlanting;
  @Property({ type: 'text' }) summary!: string;
  @Property({ fieldName: 'growth_status', type: 'string', length: 32 }) growthStatus!: string;
  @Property({ fieldName: 'schema_version', type: 'smallint', default: 1 }) schemaVersion = 1;
  @Property({ fieldName: 'input_snapshot', type: 'json' }) inputSnapshot!: Record<string, unknown>;
  @Property({ fieldName: 'result_snapshot', type: 'json' }) resultSnapshot!: Record<string, unknown>;
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() })
  createdAt = new Date();
}
