import { Collection } from '@mikro-orm/core';
import { Entity, ManyToMany, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Admin } from '../../admins/admin.entity';
import { KnowledgeStatus } from '../agriculture.enums';
import { Crop } from './crop.entity';
@Entity({ tableName: 'agriculture_knowledge' })
export class AgricultureKnowledge {
  @PrimaryKey({ type: 'integer', autoincrement: true }) id!: number;
  @Property({ type: 'string', length: 255 }) title!: string;
  @Property({ type: 'string', length: 500, nullable: true }) summary: string | null = null;
  @Property({ type: 'text' }) content!: string;
  @Property({ type: 'string', length: 32 }) category!: string;
  @Property({ fieldName: 'tags', type: 'text[]', defaultRaw: "'{}'" }) tags: string[] = [];
  @Property({ fieldName: 'region_codes', type: 'text[]', defaultRaw: "'{}'" })
  regionCodes: string[] = [];
  @Property({ fieldName: 'is_general', type: 'boolean', default: false }) isGeneral = false;
  @Property({ fieldName: 'source_name', type: 'string', length: 255, nullable: true }) sourceName:
    string | null = null;
  @Property({ fieldName: 'source_url', type: 'string', length: 1000, nullable: true }) sourceUrl:
    string | null = null;
  @Property({ fieldName: 'valid_until', type: 'date', nullable: true }) validUntil: string | null =
    null;
  @Property({ type: 'string', length: 16 }) status: KnowledgeStatus = KnowledgeStatus.Draft;
  @Property({ type: 'integer', default: 1 }) version = 1;
  @Property({ fieldName: 'content_hash', type: 'string', length: 64 }) contentHash!: string;
  @ManyToOne(() => Admin, { fieldName: 'created_by' }) createdBy!: Admin;
  @ManyToOne(() => Admin, { fieldName: 'updated_by' }) updatedBy!: Admin;
  @ManyToOne(() => Admin, { fieldName: 'published_by', nullable: true }) publishedBy: Admin | null =
    null;
  @ManyToMany(() => Crop, undefined, { owner: true, pivotTable: 'agriculture_knowledge_crops' })
  crops = new Collection<Crop>(this);
  @Property({ fieldName: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null = null;
  @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() })
  createdAt = new Date();
  @Property({
    fieldName: 'updated_at',
    type: 'timestamptz',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  updatedAt = new Date();
  @Property({ fieldName: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null = null;
}
