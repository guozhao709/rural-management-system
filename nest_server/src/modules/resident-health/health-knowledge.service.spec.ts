import type { EntityManager, EntityRepository } from '@mikro-orm/core';
import { HealthKnowledgeArticle } from './entities/health-knowledge-article.entity';
import { HealthKnowledgeVersion } from './entities/health-knowledge-version.entity';
import { HealthKnowledgeService } from './health-knowledge.service';

describe('HealthKnowledgeService', () => {
  const articles = { create: jest.fn(), findOne: jest.fn() };
  const versions = { create: jest.fn(), findOne: jest.fn(), assign: jest.fn() };
  const em = { flush: jest.fn() };
  const audit = { record: jest.fn() };
  let service: HealthKnowledgeService;

  beforeEach(() => {
    jest.clearAllMocks();
    em.flush.mockResolvedValue(undefined);
    audit.record.mockResolvedValue(undefined);
    articles.create.mockImplementation((data: Partial<HealthKnowledgeArticle>) => Object.assign(new HealthKnowledgeArticle(), { id: '3', ...data }));
    versions.create.mockImplementation((data: Partial<HealthKnowledgeVersion>) => Object.assign(new HealthKnowledgeVersion(), { id: '8', ...data }));
    service = new HealthKnowledgeService(
      articles as unknown as EntityRepository<HealthKnowledgeArticle>,
      versions as unknown as EntityRepository<HealthKnowledgeVersion>,
      em as unknown as EntityManager,
      audit as unknown as import('./health-access-audit.service').HealthAccessAuditService,
    );
  });

  it('creates a new draft version instead of overwriting a published version', async () => {
    versions.findOne.mockResolvedValue(Object.assign(new HealthKnowledgeVersion(), {
      id: '8', articleId: '3', version: 2, status: 'published', title: 'old', body: 'old', sourceName: 'NHC', sourceUrl: 'https://example.com', contentHash: 'old',
    }));
    const result = await service.updateDraft('8', {
      topic: '健康', title: 'new', body: 'new', sourceName: 'NHC', sourceUrl: 'https://example.com/new',
    });
    expect(result.status).toBe('draft');
    expect(versions.create).toHaveBeenCalledWith(expect.objectContaining({ articleId: '3', version: 3, status: 'draft', title: 'new' }), { partial: true });
    expect(versions.assign).not.toHaveBeenCalled();
  });

  it('seeds official material as idempotent drafts, never as published knowledge', async () => {
    versions.findOne.mockResolvedValue(null);
    const result = await service.seedOfficialDrafts();
    expect(result.created).toBe(1);
    expect(versions.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft' }), { partial: true });
  });
});
