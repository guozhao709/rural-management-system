import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { EntityManager, EntityRepository } from '@mikro-orm/core';
import { User } from '../users/user.entity';
import { DeterministicTestHealthCryptoAdapter } from './health-sensitive-data-crypto';
import { HealthConsent } from './entities/health-consent.entity';
import { HealthMeasurement } from './entities/health-measurement.entity';
import { HealthProfile } from './entities/health-profile.entity';
import { ResidentHealthService } from './resident-health.service';

describe('ResidentHealthService', () => {
  const consents = { findOne: jest.fn(), create: jest.fn() };
  const profiles = { findOne: jest.fn(), create: jest.fn() };
  const measurements = { findOne: jest.fn(), create: jest.fn(), findAndCount: jest.fn() };
  const entityManager = { flush: jest.fn() };
  const user = Object.assign(new User(), { id: 7 });
  let service: ResidentHealthService;

  beforeEach(() => {
    jest.clearAllMocks();
    entityManager.flush.mockResolvedValue(undefined);
    consents.create.mockImplementation((value: Partial<HealthConsent>) =>
      Object.assign(new HealthConsent(), { id: '1', ...value }),
    );
    profiles.create.mockImplementation((value: Partial<HealthProfile>) =>
      Object.assign(new HealthProfile(), value),
    );
    measurements.create.mockImplementation((value: Partial<HealthMeasurement>) =>
      Object.assign(new HealthMeasurement(), {
        id: '2',
        createdAt: new Date('2026-01-01'),
        ...value,
      }),
    );
    service = new ResidentHealthService(
      consents as unknown as EntityRepository<HealthConsent>,
      profiles as unknown as EntityRepository<HealthProfile>,
      measurements as unknown as EntityRepository<HealthMeasurement>,
      entityManager as unknown as EntityManager,
      new DeterministicTestHealthCryptoAdapter(),
    );
  });

  it('keeps consent history and only exposes the current users consent', async () => {
    const previous = Object.assign(new HealthConsent(), {
      id: 'old',
      userId: 7,
      noticeVersion: '0.9',
      scopes: ['profile'],
      revokedAt: null,
      grantedAt: new Date(),
    });
    consents.findOne.mockResolvedValue(previous);
    const result = await service.grantConsent(user, {
      noticeVersion: '1.0',
      scopes: ['profile', 'measurement'],
    });
    expect(previous.revokedAt).toBeInstanceOf(Date);
    expect(result.scopes).toEqual(['profile', 'measurement']);
    expect(consents.findOne).toHaveBeenCalledWith({ userId: 7, revokedAt: null });
  });

  it('encrypts profile fields, supports explicit null clearing, and never queries another user', async () => {
    profiles.findOne.mockResolvedValue(null);
    consents.findOne.mockResolvedValue(
      Object.assign(new HealthConsent(), { userId: 7, scopes: ['profile'], revokedAt: null }),
    );
    await service.updateProfile(user, { medicalHistory: 'unknown', allergies: null });
    const profile = profiles.create.mock.results[0]?.value as HealthProfile;
    expect(profile.medicalHistoryCiphertext).not.toBe('unknown');
    expect(profile.allergiesCiphertext).toBeNull();
    expect(profiles.findOne).toHaveBeenCalledWith({ userId: 7 });
  });

  it('fails profile writes closed if encryption is unavailable', async () => {
    const unavailable = new ResidentHealthService(
      consents as unknown as EntityRepository<HealthConsent>,
      profiles as unknown as EntityRepository<HealthProfile>,
      measurements as unknown as EntityRepository<HealthMeasurement>,
      entityManager as unknown as EntityManager,
      null,
    );
    consents.findOne.mockResolvedValue(
      Object.assign(new HealthConsent(), { userId: 7, scopes: ['profile'], revokedAt: null }),
    );
    await expect(
      unavailable.updateProfile(user, { medicalHistory: 'none' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('rejects missing consent and applies ownership to measurement deletion', async () => {
    consents.findOne.mockResolvedValue(null);
    await expect(
      service.createMeasurement(user, {
        type: 'heart_rate',
        source: 'self_reported',
        measuredAt: '2026-01-01T00:00:00.000Z',
        values: { value: 70, unit: 'bpm' },
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    measurements.findOne.mockResolvedValue(null);
    await expect(service.deleteMeasurement(user, 'other-user-record')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(measurements.findOne).toHaveBeenCalledWith({
      id: 'other-user-record',
      userId: 7,
      deletedAt: null,
    });
  });
});
