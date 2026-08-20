import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type { DatabaseHealthPort } from './database-health.port';

@Injectable()
export class DatabaseHealthIndicator implements DatabaseHealthPort {
  constructor(private readonly entityManager: EntityManager) {}

  async ping(): Promise<void> {
    await this.entityManager.getConnection().execute('select 1 as result');
  }
}
