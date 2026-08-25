import { Injectable } from '@nestjs/common';
import { AgricultureKnowledgeService } from './agriculture-knowledge.service';
export interface AgricultureRetrievalQuery {
  query: string;
  cropId?: number;
  regionCode?: string;
  limit: number;
}
@Injectable()
export class AgricultureRetrievalFacade {
  constructor(private readonly knowledge: AgricultureKnowledgeService) {}
  async search(q: AgricultureRetrievalQuery) {
    const page = await this.knowledge.list(
      {
        keyword: q.query,
        cropId: q.cropId,
        regionCode: q.regionCode,
        page: 1,
        pageSize: Math.min(q.limit, 20),
      },
      true,
    );
    return page.list.map((item) => ({
      knowledgeId: item.id,
      version: item.version,
      title: item.title,
      excerpt: (item.summary ?? item.content).slice(0, 500),
      sourceName: item.sourceName!,
      sourceUrl: item.sourceUrl,
      score: 1,
    }));
  }
}
