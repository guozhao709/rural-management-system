import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { CropAnalysis } from './crop-analysis.entity';
import { AgricultureKnowledge } from './agriculture-knowledge.entity';

@Entity({ tableName: 'crop_analysis_knowledge_refs' })
export class CropAnalysisKnowledgeRef {
  @PrimaryKey({ type: 'integer', autoincrement: true }) id!: number;
  @ManyToOne(() => CropAnalysis, { fieldName: 'analysis_id', deleteRule: 'cascade' })
  analysis!: CropAnalysis;
  @ManyToOne(() => AgricultureKnowledge, { fieldName: 'knowledge_id', deleteRule: 'restrict' })
  knowledge!: AgricultureKnowledge;
  @Property({ fieldName: 'knowledge_version', type: 'integer' }) knowledgeVersion!: number;
  @Property({ fieldName: 'title_snapshot', type: 'string', length: 255 }) titleSnapshot!: string;
  @Property({ type: 'float' }) score = 1;
}
