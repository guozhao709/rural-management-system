import type { SafetyTriagePort, TriageDecision, TriageInput } from './resident-health.types';

/**
 * Development-only reference rules from NHC Health Literacy Interpretation (2024).
 * They are deliberately conservative and must be replaced by a professionally approved ruleset before production.
 */
export class DevelopmentReferenceTriageAdapter implements SafetyTriagePort {
  async evaluate(input: TriageInput): Promise<TriageDecision> {
    const emergencyCodes = new Set([
      'chest_discomfort',
      'difficulty_breathing',
      'loss_of_consciousness',
      'seizure',
    ]);
    const matched = input.symptoms.filter((symptom) => emergencyCodes.has(symptom.code));
    if (matched.length) {
      return {
        level: 'emergency',
        reasonCodes: matched.map((symptom) => `NHC-2024-${symptom.code}`),
        message: '当前症状可能需要紧急医疗救助，请立即拨打 120 或前往急诊。',
        ruleVersion: 'development-nhc-health-literacy-2024.1',
      };
    }
    return {
      level: 'insufficient',
      reasonCodes: ['DEVELOPMENT_RULE_NO_MATCH'],
      message: '当前开发参考规则无法形成安全分诊结果，请补充信息或咨询专业人员。',
      ruleVersion: 'development-nhc-health-literacy-2024.1',
    };
  }
}
