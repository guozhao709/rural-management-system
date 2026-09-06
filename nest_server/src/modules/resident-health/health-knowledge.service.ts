import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { EntityManager } from '@mikro-orm/core';
import type { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { Admin } from '../admins/admin.entity';
import type {
  CreateHealthKnowledgeDto,
  PublishHealthKnowledgeDto,
  QueryHealthKnowledgeDto,
  UpdateHealthKnowledgeDto,
} from './dto/health-knowledge.dto';
import type { QueryPublicHealthKnowledgeDto } from './dto/query-public-health-knowledge.dto';
import { HealthKnowledgeArticle } from './entities/health-knowledge-article.entity';
import { HealthKnowledgeVersion } from './entities/health-knowledge-version.entity';
import { canPublishKnowledge, transitionKnowledgeStatus } from './knowledge-state';
import { HealthAccessAuditService } from './health-access-audit.service';
import { OFFICIAL_HEALTH_KNOWLEDGE_DRAFTS } from './health-knowledge.seed';

@Injectable()
export class HealthKnowledgeService {
  constructor(
    @InjectRepository(HealthKnowledgeArticle)
    private readonly articles: EntityRepository<HealthKnowledgeArticle>,
    @InjectRepository(HealthKnowledgeVersion)
    private readonly versions: EntityRepository<HealthKnowledgeVersion>,
    private readonly em: EntityManager,
    private readonly audit: HealthAccessAuditService,
  ) {}
  async createDraft(dto: CreateHealthKnowledgeDto) {
    const article = this.articles.create({ topic: dto.topic }, { partial: true });
    await this.em.flush();
    const content = this.content(dto);
    const version = this.versions.create(
      {
        articleId: article.id,
        version: 1,
        ...content,
        contentHash: this.hash(dto),
        status: 'draft',
      },
      { partial: true },
    );
    await this.em.flush();
    return version;
  }
  /** Safe to re-run: the content hash is unique and existing source material is left unchanged. */
  async seedOfficialDrafts() {
    const created: HealthKnowledgeVersion[] = [];
    for (const draft of OFFICIAL_HEALTH_KNOWLEDGE_DRAFTS) {
      const existing = await this.versions.findOne({ contentHash: this.hash(draft) });
      if (!existing) created.push(await this.createDraft(draft));
    }
    return { created: created.length, skipped: OFFICIAL_HEALTH_KNOWLEDGE_DRAFTS.length - created.length };
  }
  async updateDraft(id: string, dto: UpdateHealthKnowledgeDto) {
    const version = await this.getVersion(id);
    if (version.status === 'published') {
      const next = this.versions.create(
        {
          articleId: version.articleId,
          version: version.version + 1,
          ...this.content(dto),
          contentHash: this.hash(dto),
          status: 'draft',
        },
        { partial: true },
      );
      await this.em.flush();
      await this.audit.record({ actorType: 'system', actorId: 'knowledge-workflow', action: 'create_draft', resourceType: 'health_knowledge_version', resourceId: next.id, purpose: 'knowledge_revision', outcome: 'success' });
      return next;
    }
    if (version.status !== 'draft')
      throw new BadRequestException('送审中的知识版本不可编辑');
    const content = this.content(dto);
    this.versions.assign(version, { ...content, contentHash: this.hash(dto) });
    await this.em.flush();
    await this.audit.record({ actorType: 'system', actorId: 'knowledge-workflow', action: 'update_draft', resourceType: 'health_knowledge_version', resourceId: version.id, purpose: 'knowledge_governance', outcome: 'success' });
    return version;
  }
  async submitReview(id: string) {
    const version = await this.getVersion(id);
    version.status = transitionKnowledgeStatus(
      version.status as 'draft' | 'in_review',
      'in_review',
    );
    await this.em.flush();
    await this.audit.record({ actorType: 'system', actorId: 'knowledge-workflow', action: 'submit_review', resourceType: 'health_knowledge_version', resourceId: version.id, purpose: 'knowledge_governance', outcome: 'success' });
    return version;
  }
  async publish(id: string, admin: Admin, dto: PublishHealthKnowledgeDto) {
    const version = await this.getVersion(id);
    const reviewedAt = new Date(dto.reviewedAt);
    const reviewDueAt = new Date(dto.reviewDueAt);
    if (!canPublishKnowledge({ ...version, reviewerId: admin.id, reviewedAt, reviewDueAt }))
      throw new BadRequestException('发布需要可核验来源、审核记录和未来复核日期');
    version.status = transitionKnowledgeStatus(version.status as 'in_review', 'published');
    version.reviewerId = admin.id;
    version.reviewedAt = reviewedAt;
    version.reviewDueAt = reviewDueAt;
    version.publishedAt = new Date();
    const article = await this.articles.findOne({ id: version.articleId });
    if (!article) throw new NotFoundException('知识文章不存在');
    article.currentPublishedVersionId = version.id;
    await this.em.flush();
    await this.audit.record({ actorType: 'admin', actorId: admin.id, action: 'publish', resourceType: 'health_knowledge_version', resourceId: version.id, purpose: 'knowledge_governance', outcome: 'success' });
    return version;
  }
  async archive(id: string) {
    const version = await this.getVersion(id);
    version.status = transitionKnowledgeStatus(version.status as 'published', 'archived');
    await this.em.flush();
    await this.audit.record({ actorType: 'system', actorId: 'knowledge-workflow', action: 'archive', resourceType: 'health_knowledge_version', resourceId: version.id, purpose: 'knowledge_governance', outcome: 'success' });
    return version;
  }
  async list(query: QueryHealthKnowledgeDto) {
    return this.versions.findAndCount(query.status ? { status: query.status } : {}, {
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
      orderBy: { id: 'DESC' },
    });
  }
  async reviewDue() {
    return this.versions.find(
      { status: 'published', reviewDueAt: { $lte: new Date() } },
      { orderBy: { reviewDueAt: 'ASC' } },
    );
  }

  async searchPublished(query: QueryPublicHealthKnowledgeDto) {
    const now = new Date();
    const where = {
      status: 'published',
      reviewDueAt: { $gt: now },
      ...(query.keyword && {
        $or: [
          { title: { $ilike: `%${query.keyword}%` } },
          { body: { $ilike: `%${query.keyword}%` } },
        ],
      }),
    };
    const [list, total] = await this.versions.findAndCount(where, {
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
      orderBy: { publishedAt: 'DESC' },
    });
    return { list, total, page: query.page, pageSize: query.pageSize };
  }

  async findPublished(articleId: string): Promise<HealthKnowledgeVersion | null> {
    return this.versions.findOne({
      articleId,
      status: 'published',
      reviewDueAt: { $gt: new Date() },
    });
  }
  private async getVersion(id: string) {
    const version = await this.versions.findOne({ id });
    if (!version) throw new NotFoundException('健康知识版本不存在');
    return version;
  }
  private hash(value: Pick<CreateHealthKnowledgeDto, 'title' | 'body' | 'sourceUrl'>) {
    return createHash('sha256')
      .update(`${value.title}\n${value.body}\n${value.sourceUrl}`)
      .digest('hex');
  }
  private content(value: CreateHealthKnowledgeDto) {
    return {
      title: value.title,
      body: value.body,
      sourceName: value.sourceName,
      sourceUrl: value.sourceUrl,
    };
  }
}
