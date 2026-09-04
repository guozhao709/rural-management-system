import { HealthDataLifecycleService } from './health-data-lifecycle.service';

describe('HealthDataLifecycleService', () => {
  it('physically removes a deleted users health records through the lifecycle boundary', async () => {
    const assessments = { nativeDelete: jest.fn().mockResolvedValue(1) };
    const measurements = { nativeDelete: jest.fn().mockResolvedValue(1) };
    const service = new HealthDataLifecycleService(assessments as never, measurements as never, { nativeDelete: jest.fn() } as never, { nativeDelete: jest.fn() } as never, { nativeDelete: jest.fn() } as never, { get: jest.fn().mockReturnValue(365) } as never);
    await service.purgeForUser(7);
    expect(assessments.nativeDelete).toHaveBeenCalledWith({ userId: 7 });
    expect(measurements.nativeDelete).toHaveBeenCalledWith({ userId: 7 });
  });
});
