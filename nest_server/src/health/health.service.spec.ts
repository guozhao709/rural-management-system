import { HealthService } from './health.service';

describe('HealthService', () => {
  const databaseHealth = {
    ping: jest.fn<Promise<void>, []>(),
  };
  const service = new HealthService(databaseHealth);

  beforeEach(() => {
    databaseHealth.ping.mockReset();
    databaseHealth.ping.mockResolvedValue(undefined);
  });

  it('returns a liveness status without querying the database', () => {
    expect(service.getLiveness()).toEqual({ status: 'ok' });
    expect(databaseHealth.ping).not.toHaveBeenCalled();
  });

  it('returns readiness after PostgreSQL responds', async () => {
    await expect(service.getReadiness()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
    expect(databaseHealth.ping).toHaveBeenCalledTimes(1);
  });
});
