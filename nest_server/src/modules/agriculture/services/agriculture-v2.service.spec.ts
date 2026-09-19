import { ConflictException, NotFoundException } from '@nestjs/common';
import { AgricultureV2Service } from './agriculture-v2.service';

const construct = (overrides: Record<string, unknown> = {}) => {
  const defaults = { findOne: jest.fn(), find: jest.fn(), findAndCount: jest.fn(), count: jest.fn().mockResolvedValue(0), create: jest.fn() };
  const em = { getReference: jest.fn(), flush: jest.fn().mockResolvedValue(undefined), remove: jest.fn() };
  const repositories = Array.from({ length: 8 }, () => ({ ...defaults, ...overrides }));
  const [lands, plantings, metrics, records, evaluations, analyses, crops, knowledge] = repositories;
  return { service: new AgricultureV2Service(lands as never, plantings as never, metrics as never, records as never, evaluations as never, analyses as never, crops as never, knowledge as never, em as never), repositories, em };
};

describe('AgricultureV2Service authorization and lifecycle', () => {
  it('returns the same not-found response for another users metric', async () => {
    const { service, repositories } = construct();
    repositories[2]!.findOne.mockResolvedValue({ id: 'metric-id', planting: { land: { user: { id: 2 } } } });
    await expect(service.findMetric(1, 'metric-id')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('rejects an illegal planting status transition', async () => {
    const { service, repositories } = construct();
    repositories[1]!.findOne.mockResolvedValue({ id: 'planting-id', status: 'ended', land: { user: { id: 1 } }, crop: { id: 1 } });
    await expect(service.patchPlanting(1, 'planting-id', { status: 'growing' })).rejects.toBeInstanceOf(ConflictException);
  });
});
