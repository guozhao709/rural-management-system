import { Inject, Injectable } from '@nestjs/common';
import {
  DATABASE_HEALTH,
  type DatabaseHealthPort,
} from '../infrastructure/database/database-health.port';

export interface LivenessStatus {
  status: 'ok';
}

export interface ReadinessStatus extends LivenessStatus {
  database: 'up';
}

@Injectable()
export class HealthService {
  constructor(@Inject(DATABASE_HEALTH) private readonly databaseHealth: DatabaseHealthPort) {}

  getLiveness(): LivenessStatus {
    return { status: 'ok' };
  }

  async getReadiness(): Promise<ReadinessStatus> {
    await this.databaseHealth.ping();
    return { status: 'ok', database: 'up' };
  }
}
