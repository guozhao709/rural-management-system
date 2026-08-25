import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'health_consents' })
@Index({ name: 'idx_health_consents_user_active', properties: ['userId', 'revokedAt'] })
export class HealthConsent {
  @PrimaryKey({ type: 'bigint', autoincrement: true }) id!: string;
  @Property({ fieldName: 'user_id', type: 'integer' }) userId!: number;
  @Property({ fieldName: 'notice_version', type: 'string', length: 100 }) noticeVersion!: string;
  @Property({ type: 'json' }) scopes!: string[];
  @Property({ fieldName: 'granted_at', type: 'timestamptz' }) grantedAt: Date = new Date();
  @Property({ fieldName: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null = null;
}
