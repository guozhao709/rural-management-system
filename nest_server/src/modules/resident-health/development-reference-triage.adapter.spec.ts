import { DevelopmentReferenceTriageAdapter } from './development-reference-triage.adapter';

describe('DevelopmentReferenceTriageAdapter', () => {
  const adapter = new DevelopmentReferenceTriageAdapter();
  it('returns emergency immediately for the official-reference emergency symptom codes', async () => {
    await expect(
      adapter.evaluate({
        symptoms: [{ code: 'difficulty_breathing', severity: 'moderate', course: 'new' }],
      }),
    ).resolves.toMatchObject({
      level: 'emergency',
      ruleVersion: 'development-nhc-health-literacy-2024.1',
    });
  });
  it('fails safe to insufficient when no reference rule matches', async () => {
    await expect(
      adapter.evaluate({ symptoms: [{ code: 'fatigue', severity: 'mild', course: 'new' }] }),
    ).resolves.toMatchObject({ level: 'insufficient' });
  });
});
