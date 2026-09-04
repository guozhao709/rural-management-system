import { Injectable } from '@nestjs/common';
import type { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { HealthAccessAudit } from './entities/health-access-audit.entity';

export interface HealthAuditEvent {
  actorType: 'user' | 'admin' | 'system';
  actorId: string | number;
  action: string;
  resourceType: string;
  resourceId: string | number;
  purpose: string;
  requestId?: string;
  outcome: 'success' | 'denied' | 'failed';
}

@Injectable()
export class HealthAccessAuditService {
  constructor(
    @InjectRepository(HealthAccessAudit) private readonly audits: EntityRepository<HealthAccessAudit>,
    private readonly em: EntityManager,
  ) {}

  async record(event: HealthAuditEvent): Promise<void> {
    this.audits.create({
      actorType: event.actorType,
      actorId: String(event.actorId),
      action: event.action,
      resourceType: event.resourceType,
      resourceId: String(event.resourceId),
      purpose: event.purpose,
      requestId: event.requestId ?? null,
      outcome: event.outcome,
    }, { partial: true });
    await this.em.flush();
  }
}
