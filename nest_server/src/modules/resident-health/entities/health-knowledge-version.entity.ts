import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
@Entity({ tableName: 'health_knowledge_versions' })
@Index({
  name: 'uq_health_knowledge_versions_article_version',
  properties: ['articleId', 'version'],
  options: { unique: true },
})
export class HealthKnowledgeVersion {
  @PrimaryKey({ type: 'bigint', autoincrement: true }) id!: string;
  @Property({ fieldName: 'article_id', type: 'bigint' }) articleId!: string;
  @Property({ type: 'integer' }) version!: number;
  @Property({ type: 'string', length: 300 }) title!: string;
  @Property({ type: 'text' }) body!: string;
  @Property({ fieldName: 'source_name', type: 'string', length: 300 }) sourceName!: string;
  @Property({ fieldName: 'source_url', type: 'string', length: 2000 }) sourceUrl!: string;
  @Property({ fieldName: 'content_hash', type: 'string', length: 64, unique: true })
  contentHash!: string;
  @Property({ type: 'string', length: 20 }) status = 'draft';
  @Property({ fieldName: 'reviewer_id', type: 'integer', nullable: true }) reviewerId:
    number | null = null;
  @Property({ fieldName: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null = null;
  @Property({ fieldName: 'review_due_at', type: 'timestamptz', nullable: true })
  reviewDueAt: Date | null = null;
  @Property({ fieldName: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null = null;
}
