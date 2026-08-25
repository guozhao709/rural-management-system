import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { Admin } from '../admins/admin.entity';
import type {
  CreateHealthKnowledgeDto,
  PublishHealthKnowledgeDto,
  QueryHealthKnowledgeDto,
  UpdateHealthKnowledgeDto,
} from './dto/health-knowledge.dto';
import { HealthKnowledgeArticle } from './entities/health-knowledge-article.entity';
import { HealthKnowledgeVersion } from './entities/health-knowledge-version.entity';
import { canPublishKnowledge, transitionKnowledgeStatus } from './knowledge-state';

@Injectable()
export class HealthKnowledgeService {
  constructor(
    @InjectRepository(HealthKnowledgeArticle)
    private readonly articles: EntityRepository<HealthKnowledgeArticle>,
    @InjectRepository(HealthKnowledgeVersion)
    private readonly versions: EntityRepository<HealthKnowledgeVersion>,
    private readonly em: EntityManager,
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
  async updateDraft(id: string, dto: UpdateHealthKnowledgeDto) {
    const version = await this.getVersion(id);
    if (version.status !== 'draft')
      throw new BadRequestException('已送审或发布的知识版本不可原地编辑');
    const content = this.content(dto);
    this.versions.assign(version, { ...content, contentHash: this.hash(dto) });
    await this.em.flush();
    return version;
  }
  async submitReview(id: string) {
    const version = await this.getVersion(id);
    version.status = transitionKnowledgeStatus(
      version.status as 'draft' | 'in_review',
      'in_review',
    );
    await this.em.flush();
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
    return version;
  }
  async archive(id: string) {
    const version = await this.getVersion(id);
    version.status = transitionKnowledgeStatus(version.status as 'published', 'archived');
    await this.em.flush();
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
