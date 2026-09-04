import { Injectable, NotFoundException } from '@nestjs/common';
import { HealthKnowledgeService } from './health-knowledge.service';
import type {
  PublicHealthKnowledgeItem,
  PublicHealthKnowledgeQuery,
} from './resident-health.types';

@Injectable()
export class ResidentHealthRetrievalFacade {
  constructor(private readonly knowledge: HealthKnowledgeService) {}

  async searchPublicKnowledge(
    query: PublicHealthKnowledgeQuery,
  ): Promise<PublicHealthKnowledgeItem[]> {
    const result = await this.knowledge.searchPublished({
      keyword: query.query,
      page: 1,
      pageSize: query.limit,
    });
    return result.list.map((item) => ({
      knowledgeId: Number(item.articleId),
      version: item.version,
      title: item.title,
      excerpt: item.body.slice(0, 240),
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      reviewedAt: item.reviewedAt!.toISOString(),
      score: 1,
    }));
  }

  async getPublicKnowledge(id: string): Promise<PublicHealthKnowledgeItem> {
    const item = await this.knowledge.findPublished(id);
    if (!item) throw new NotFoundException('健康知识不存在或尚未发布');
    return {
      knowledgeId: Number(item.articleId),
      version: item.version,
      title: item.title,
      excerpt: item.body.slice(0, 240),
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      reviewedAt: item.reviewedAt!.toISOString(),
      score: 1,
    };
  }
}
