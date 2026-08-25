import { ServiceUnavailableException } from '@nestjs/common';
import type { SafetyTriagePort, TriageDecision, TriageInput } from './resident-health.types';

/** Fails closed until a professionally approved versioned ruleset is installed. */
export class UnavailableSafetyTriageAdapter implements SafetyTriagePort {
  async evaluate(input: TriageInput): Promise<TriageDecision> {
    void input;
    throw new ServiceUnavailableException('健康安全分诊规则尚未启用');
  }
}

const urgency: Record<TriageDecision['level'], number> = {
  insufficient: 0,
  self_care: 1,
  routine: 2,
  urgent: 3,
  emergency: 4,
};

/** The model may add explanation but can never lower the deterministic rule outcome. */
export const mergeTriage = (rule: TriageDecision, proposed: TriageDecision): TriageDecision =>
  urgency[proposed.level] > urgency[rule.level] ? proposed : rule;
