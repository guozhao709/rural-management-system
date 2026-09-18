import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import type { SystemMetricType } from '../health.types';

@Entity({ tableName: 'health_metric_templates' })
export class HealthMetricTemplate {
  @PrimaryKey({ type: 'integer', autoincrement: true }) id!: number;
  @Property({ fieldName: 'user_id', type: 'integer' }) userId!: number;
  @Property({ type: 'string', length: 100 }) name!: string;
  @Property({ fieldName: 'metric_name', type: 'string', length: 100 }) metricName!: string;
  @Property({ type: 'string', length: 30 }) unit!: string;
  @Property({ fieldName: 'related_system_metric_type', type: 'string', length: 30, nullable: true }) relatedSystemMetricType: SystemMetricType | null = null;
  @Property({ fieldName: 'started_at', type: 'timestamptz' }) startedAt!: Date;
  @Property({ fieldName: 'ended_at', type: 'timestamptz', nullable: true }) endedAt: Date | null = null;
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() }) createdAt = new Date();
  @Property({ fieldName: 'updated_at', type: 'timestamptz', onCreate: () => new Date(), onUpdate: () => new Date() }) updatedAt = new Date();
}
