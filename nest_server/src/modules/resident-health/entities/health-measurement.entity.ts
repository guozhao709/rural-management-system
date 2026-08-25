import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'health_measurements' })
@Index({
  name: 'idx_health_measurements_user_type_measured_at',
  properties: ['userId', 'type', 'measuredAt'],
})
export class HealthMeasurement {
  @PrimaryKey({ type: 'bigint', autoincrement: true }) id!: string;
  @Property({ fieldName: 'user_id', type: 'integer' }) userId!: number;
  @Property({ type: 'string', length: 32 }) type!: string;
  @Property({ type: 'json' }) values!: object;
  @Property({ fieldName: 'measured_at', type: 'timestamptz' }) measuredAt!: Date;
  @Property({ type: 'string', length: 32 }) source!: string;
  @Property({ fieldName: 'schema_version', type: 'string', length: 20 }) schemaVersion = '1.0';
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() })
  createdAt: Date = new Date();
  @Property({ fieldName: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null = null;
}
