import type { EntityManager, EntityRepository } from '@mikro-orm/core';
import { HealthAccessAudit } from './entities/health-access-audit.entity';
import { HealthAccessAuditService } from './health-access-audit.service';

describe('HealthAccessAuditService', () => {
  it('persists only metadata, not a health data payload', async () => {
    const audits = { create: jest.fn() };
    const em = { flush: jest.fn().mockResolvedValue(undefined) };
    const service = new HealthAccessAuditService(
      audits as unknown as EntityRepository<HealthAccessAudit>, em as unknown as EntityManager,
    );
    await service.record({ actorType: 'user', actorId: 7, action: 'read', resourceType: 'health_profile', resourceId: 7, purpose: 'self_service', outcome: 'success' });
    expect(audits.create).toHaveBeenCalledWith({
      actorType: 'user', actorId: '7', action: 'read', resourceType: 'health_profile', resourceId: '7',
      purpose: 'self_service', requestId: null, outcome: 'success',
    }, { partial: true });
    expect(em.flush).toHaveBeenCalled();
  });
});
