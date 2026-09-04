import { DevelopmentReferenceTriageAdapter } from './development-reference-triage.adapter';
import { createSafetyTriageAdapter } from './resident-health.module';
import { UnavailableSafetyTriageAdapter } from './safety-triage';

describe('createSafetyTriageAdapter', () => {
  it('allows the clearly marked development reference adapter outside production only', () => {
    expect(createSafetyTriageAdapter(true, 'development')).toBeInstanceOf(DevelopmentReferenceTriageAdapter);
    expect(createSafetyTriageAdapter(true, 'production')).toBeInstanceOf(UnavailableSafetyTriageAdapter);
    expect(createSafetyTriageAdapter(false, 'development')).toBeInstanceOf(UnavailableSafetyTriageAdapter);
  });
});
