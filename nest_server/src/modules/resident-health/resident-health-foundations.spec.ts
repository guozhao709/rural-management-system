import { ServiceUnavailableException } from '@nestjs/common';
import { parseSafeHealthExplanation } from './health-explanation.schema';
import { healthMeasurementSchema } from './measurement.schema';
import { UnavailableSafetyTriageAdapter, mergeTriage } from './safety-triage';
import type { TriageDecision } from './resident-health.types';

const decision = (level: TriageDecision['level']): TriageDecision => ({
  level,
  reasonCodes: ['RULE-1'],
  message: '请寻求帮助',
  ruleVersion: 'test',
});

describe('resident health safety foundations', () => {
  it('accepts only the five fixed measurement units and never future dates', () => {
    expect(
      healthMeasurementSchema.safeParse({
        type: 'body_temperature',
        value: 36.5,
        unit: 'celsius',
        source: 'self_reported',
        measuredAt: '2026-01-01T00:00:00.000Z',
      }).success,
    ).toBe(true);
    expect(
      healthMeasurementSchema.safeParse({
        type: 'body_temperature',
        value: 36.5,
        unit: 'fahrenheit',
        source: 'self_reported',
        measuredAt: '2026-01-01T00:00:00.000Z',
      }).success,
    ).toBe(false);
    expect(
      healthMeasurementSchema.safeParse({
        type: 'heart_rate',
        value: 80,
        unit: 'bpm',
        source: 'self_reported',
        measuredAt: '2999-01-01T00:00:00.000Z',
      }).success,
    ).toBe(false);
  });

  it('fails closed while no professionally approved rules exist', async () => {
    await expect(
      new UnavailableSafetyTriageAdapter().evaluate({ symptoms: [] }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('does not let a model reduce deterministic urgency', () => {
    expect(mergeTriage(decision('emergency'), decision('self_care')).level).toBe('emergency');
    expect(mergeTriage(decision('routine'), decision('urgent')).level).toBe('urgent');
  });

  it('rejects dangerous or malformed AI explanations rather than downgrading them', () => {
    const response = {
      schemaVersion: '1.0',
      triage: { level: 'urgent', reasonCodes: ['RULE-1'], message: '尽快就医' },
      summary: '请尽快获得专业评估。',
      factors: [],
      nextActions: ['联系医疗机构'],
      selfCare: [],
      warningSignals: [],
      knowledgeReferences: [],
      limitations: ['本结果不构成诊断'],
      aiGenerated: true,
      generatedAt: '2026-01-01T00:00:00.000Z',
    };
    expect(parseSafeHealthExplanation(response)).not.toBeNull();
    expect(parseSafeHealthExplanation({ ...response, summary: '建议服用某药品 20mg' })).toBeNull();
    expect(parseSafeHealthExplanation({ ...response, probability: '90%' })).toBeNull();
  });
});
