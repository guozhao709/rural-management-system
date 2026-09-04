import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'health_assessments' })
@Index({ name: 'idx_health_assessments_user_created_at', properties: ['userId', 'createdAt'] })
export class HealthAssessment {
  @PrimaryKey({ type: 'uuid' }) id!: string;
  @Property({ fieldName: 'user_id', type: 'integer' }) userId!: number;
  @Property({ fieldName: 'consent_id', type: 'bigint' }) consentId!: string;
  @Property({ fieldName: 'idempotency_key', type: 'string', length: 128 }) idempotencyKey!: string;
  @Property({ type: 'string', length: 20 }) status!: string;
  @Property({ fieldName: 'triage_level', type: 'string', length: 20 }) triageLevel!: string;
  @Property({ fieldName: 'input_snapshot_ciphertext', type: 'json' }) inputSnapshotCiphertext!: object;
  @Property({ fieldName: 'rule_result', type: 'json' }) ruleResult!: object;
  @Property({ type: 'json', nullable: true }) result: object | null = null;
  @Property({ fieldName: 'rule_version', type: 'string', length: 100 }) ruleVersion!: string;
  @Property({ fieldName: 'schema_version', type: 'string', length: 20 }) schemaVersion = '1.0';
  @Property({ fieldName: 'prompt_version', type: 'string', length: 50, nullable: true }) promptVersion: string | null = null;
  @Property({ fieldName: 'error_code', type: 'string', length: 100, nullable: true }) errorCode: string | null = null;
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() }) createdAt: Date = new Date();
  @Property({ fieldName: 'completed_at', type: 'timestamptz', nullable: true }) completedAt: Date | null = null;
  @Property({ fieldName: 'deleted_at', type: 'timestamptz', nullable: true }) deletedAt: Date | null = null;
}
