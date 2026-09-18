import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'health_analyses' })
export class HealthAnalysis {
  @PrimaryKey({ type: 'integer', autoincrement: true }) id!: number;
  @Property({ fieldName: 'user_id', type: 'integer' }) userId!: number;
  @Property({ fieldName: 'input_snapshot', type: 'json' }) inputSnapshot!: object;
  @Property({ fieldName: 'context_snapshot', type: 'json' }) contextSnapshot!: object;
  @Property({ fieldName: 'result_snapshot', type: 'json' }) resultSnapshot!: object;
  @Property({ fieldName: 'schema_version', type: 'string', length: 20, nullable: true }) schemaVersion: string | null = null;
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() }) createdAt = new Date();
}
