import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'health_knowledge' })
export class HealthKnowledge {
  @PrimaryKey({ type: 'integer', autoincrement: true }) id!: number;
  @Property({ type: 'string', length: 200 }) title!: string;
  @Property({ type: 'text', nullable: true }) summary: string | null = null;
  @Property({ type: 'text' }) content!: string;
  @Property({ type: 'string', length: 50 }) category!: string;
  @Property({ type: 'text[]', defaultRaw: "'{}'" }) tags: string[] = [];
  @Property({ fieldName: 'source_name', type: 'string', length: 200 }) sourceName!: string;
  @Property({ fieldName: 'source_url', type: 'text', nullable: true }) sourceUrl: string | null = null;
  @Property({ fieldName: 'is_published', type: 'boolean' }) isPublished = false;
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() }) createdAt = new Date();
  @Property({ fieldName: 'updated_at', type: 'timestamptz', onCreate: () => new Date(), onUpdate: () => new Date() }) updatedAt = new Date();
}
