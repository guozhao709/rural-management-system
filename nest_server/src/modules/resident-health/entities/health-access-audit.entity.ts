import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/** Metadata-only audit trail. It intentionally has no health text, IP, token or prompt columns. */
@Entity({ tableName: 'health_access_audits' })
@Index({ name: 'idx_health_access_audits_actor_created_at', properties: ['actorId', 'createdAt'] })
export class HealthAccessAudit {
  @PrimaryKey({ type: 'bigint', autoincrement: true }) id!: string;
  @Property({ fieldName: 'actor_type', type: 'string', length: 20 }) actorType!: string;
  @Property({ fieldName: 'actor_id', type: 'string', length: 64 }) actorId!: string;
  @Property({ type: 'string', length: 64 }) action!: string;
  @Property({ fieldName: 'resource_type', type: 'string', length: 64 }) resourceType!: string;
  @Property({ fieldName: 'resource_id', type: 'string', length: 128 }) resourceId!: string;
  @Property({ type: 'string', length: 128 }) purpose!: string;
  @Property({ fieldName: 'request_id', type: 'string', length: 128, nullable: true }) requestId: string | null = null;
  @Property({ type: 'string', length: 20 }) outcome!: string;
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() }) createdAt: Date = new Date();
}
