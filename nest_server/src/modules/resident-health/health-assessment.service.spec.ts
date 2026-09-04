import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { EntityManager, EntityRepository } from '@mikro-orm/core';
import { User } from '../users/user.entity';
import { DevelopmentReferenceTriageAdapter } from './development-reference-triage.adapter';
import { DeterministicTestHealthCryptoAdapter } from './health-sensitive-data-crypto';
import { HealthAssessment } from './entities/health-assessment.entity';
import { HealthConsent } from './entities/health-consent.entity';
import { HealthMeasurement } from './entities/health-measurement.entity';
import { HealthProfile } from './entities/health-profile.entity';
import { HealthAssessmentService } from './health-assessment.service';

describe('HealthAssessmentService', () => {
  const assessments = { findOne: jest.fn(), findAndCount: jest.fn(), create: jest.fn() };
  const consents = { findOne: jest.fn() };
  const profiles = { findOne: jest.fn() };
  const measurements = { find: jest.fn() };
  const entityManager = { flush: jest.fn() };
  const audit = { record: jest.fn() };
  const user = Object.assign(new User(), { id: 7 });
  let service: HealthAssessmentService;

  beforeEach(() => {
    jest.clearAllMocks();
    entityManager.flush.mockResolvedValue(undefined);
    audit.record.mockResolvedValue(undefined);
    assessments.create.mockImplementation((value: Partial<HealthAssessment>) =>
      Object.assign(new HealthAssessment(), { createdAt: new Date('2026-08-25T00:00:00.000Z'), ...value }),
    );
    consents.findOne.mockResolvedValue(
      Object.assign(new HealthConsent(), { id: '11', userId: 7, scopes: ['assessment'], revokedAt: null }),
    );
    profiles.findOne.mockResolvedValue(null);
    measurements.find.mockResolvedValue([]);
    service = new HealthAssessmentService(
      assessments as unknown as EntityRepository<HealthAssessment>,
      consents as unknown as EntityRepository<HealthConsent>,
      profiles as unknown as EntityRepository<HealthProfile>,
      measurements as unknown as EntityRepository<HealthMeasurement>,
      entityManager as unknown as EntityManager,
      new DeterministicTestHealthCryptoAdapter(),
      new DevelopmentReferenceTriageAdapter(),
      { assessmentDailyLimit: 5, aiExplanationEnabled: false },
      { explain: jest.fn() },
      audit as unknown as import('./health-access-audit.service').HealthAccessAuditService,
    );
  });

  it('creates an encrypted, deterministic emergency assessment from the current user only', async () => {
    assessments.findOne.mockResolvedValueOnce(null);
    assessments.findAndCount.mockResolvedValueOnce([[], 0]);
    const result = await service.create(user, {
      idempotencyKey: 'key-1',
      symptoms: [{ code: 'chest_discomfort', severity: 'moderate', course: 'persistent', startedAt: '2026-08-25T08:00:00.000Z' }],
    });

    expect((result.triage as { level: string }).level).toBe('emergency');
    expect(result.aiGenerated).toBe(false);
    expect(assessments.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, status: 'succeeded' }), { partial: true });
    const created = assessments.create.mock.results[0]?.value as HealthAssessment;
    const encrypted = created.inputSnapshotCiphertext as { ciphertext: string };
    expect(typeof encrypted.ciphertext).toBe('string');
    expect(Buffer.from(encrypted.ciphertext, 'base64').toString()).not.toContain('userId');
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'create', resourceId: created.id }));
  });

  it('returns the prior result for the same user idempotency key without evaluating again', async () => {
    assessments.findOne.mockResolvedValueOnce(Object.assign(new HealthAssessment(), {
      id: 'existing', userId: 7, status: 'succeeded', triageLevel: 'insufficient', ruleVersion: 'v1',
      result: { schemaVersion: '1.0', triage: { level: 'insufficient', reasonCodes: [], message: '信息不足' }, summary: '信息不足', factors: [], nextActions: [], selfCare: [], warningSignals: [], knowledgeReferences: [], limitations: ['不构成诊断'], aiGenerated: false, generatedAt: new Date() },
    }));
    const result = await service.create(user, { idempotencyKey: 'same-key', symptoms: [{ code: 'fever', severity: 'mild', course: 'new', startedAt: '2026-08-25T08:00:00.000Z' }] });
    expect(result.id).toBe('existing');
    expect(assessments.findAndCount).not.toHaveBeenCalled();
  });

  it('fails closed when assessment consent is absent and hides records owned by another user', async () => {
    consents.findOne.mockResolvedValueOnce(null);
    await expect(service.create(user, { idempotencyKey: 'denied', symptoms: [{ code: 'fever', severity: 'mild', course: 'new', startedAt: '2026-08-25T08:00:00.000Z' }] })).rejects.toBeInstanceOf(ServiceUnavailableException);
    assessments.findOne.mockResolvedValueOnce(null);
    await expect(service.getOne(user, 'someone-else')).rejects.toBeInstanceOf(NotFoundException);
    expect(assessments.findOne).toHaveBeenLastCalledWith({ id: 'someone-else', userId: 7, deletedAt: null });
  });
});
