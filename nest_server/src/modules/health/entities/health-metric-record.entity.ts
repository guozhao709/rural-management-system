import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import type { MetricType } from '../health.types';

@Entity({ tableName: 'health_metric_records' })
export class HealthMetricRecord {
  @PrimaryKey({ type: 'integer', autoincrement: true }) id!: number;
  @Property({ fieldName: 'user_id', type: 'integer' }) userId!: number;
  @Property({ fieldName: 'metric_type', type: 'string', length: 30 }) metricType!: MetricType;
  @Property({ fieldName: 'template_id', type: 'integer', nullable: true }) templateId: number | null = null;
  @Property({ fieldName: 'numeric_value', type: 'decimal', nullable: true }) numericValue: string | null = null;
  @Property({ fieldName: 'systolic_value', type: 'decimal', nullable: true }) systolicValue: string | null = null;
  @Property({ fieldName: 'diastolic_value', type: 'decimal', nullable: true }) diastolicValue: string | null = null;
  @Property({ type: 'string', length: 30 }) unit!: string;
  @Property({ fieldName: 'measured_at', type: 'timestamptz' }) measuredAt!: Date;
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() }) createdAt = new Date();
}
