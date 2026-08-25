import { BadRequestException } from '@nestjs/common';

export const KNOWLEDGE_STATUSES = ['draft', 'in_review', 'published', 'archived'] as const;
export type KnowledgeStatus = (typeof KNOWLEDGE_STATUSES)[number];

export const transitionKnowledgeStatus = (
  current: KnowledgeStatus,
  next: KnowledgeStatus,
): KnowledgeStatus => {
  const allowed: Record<KnowledgeStatus, KnowledgeStatus[]> = {
    draft: ['in_review'],
    in_review: ['draft', 'published'],
    published: ['archived'],
    archived: [],
  };
  if (!allowed[current].includes(next))
    throw new BadRequestException(`知识内容不能从 ${current} 转为 ${next}`);
  return next;
};

export const canPublishKnowledge = (input: {
  sourceUrl?: string | null;
  sourceName?: string | null;
  reviewerId?: number | null;
  reviewedAt?: Date | null;
  reviewDueAt?: Date | null;
}): boolean =>
  Boolean(
    input.sourceUrl &&
    input.sourceName &&
    input.reviewerId &&
    input.reviewedAt &&
    input.reviewDueAt &&
    input.reviewDueAt > input.reviewedAt,
  );
