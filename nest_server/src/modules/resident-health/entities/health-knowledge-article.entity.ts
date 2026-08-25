import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
@Entity({ tableName: 'health_knowledge_articles' })
export class HealthKnowledgeArticle {
  @PrimaryKey({ type: 'bigint', autoincrement: true }) id!: string;
  @Property({ type: 'string', length: 100 }) topic!: string;
  @Property({ fieldName: 'current_published_version_id', type: 'bigint', nullable: true })
  currentPublishedVersionId: string | null = null;
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() })
  createdAt: Date = new Date();
}
