import { NotFoundException } from '@nestjs/common';
import { ResidentHealthRetrievalFacade } from './resident-health-retrieval.facade';

describe('ResidentHealthRetrievalFacade', () => {
  const knowledge = { searchPublished: jest.fn(), findPublished: jest.fn() };
  const facade = new ResidentHealthRetrievalFacade(knowledge as never);

  beforeEach(() => jest.clearAllMocks());

  it('returns only minimal public knowledge fields from published search results', async () => {
    knowledge.searchPublished.mockResolvedValue({
      list: [
        {
          articleId: '12',
          version: 3,
          title: '科学就医',
          body: '公开健康科普正文',
          sourceName: '国家卫健委',
          sourceUrl: 'https://example.test/source',
          reviewedAt: new Date('2026-01-01'),
          userId: 99,
        },
      ],
      total: 1,
    });
    await expect(facade.searchPublicKnowledge({ query: '就医', limit: 3 })).resolves.toEqual([
      {
        knowledgeId: 12,
        version: 3,
        title: '科学就医',
        excerpt: '公开健康科普正文',
        sourceName: '国家卫健委',
        sourceUrl: 'https://example.test/source',
        reviewedAt: '2026-01-01T00:00:00.000Z',
        score: 1,
      },
    ]);
    expect(knowledge.searchPublished).toHaveBeenCalledWith({
      keyword: '就医',
      page: 1,
      pageSize: 3,
    });
  });

  it('does not turn missing or unpublished content into a visible result', async () => {
    knowledge.findPublished.mockResolvedValue(null);
    await expect(facade.getPublicKnowledge('99')).rejects.toBeInstanceOf(NotFoundException);
  });
});
