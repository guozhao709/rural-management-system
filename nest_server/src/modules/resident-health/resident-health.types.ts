export const TRIAGE_LEVELS = [
  'emergency',
  'urgent',
  'routine',
  'self_care',
  'insufficient',
] as const;
export type TriageLevel = (typeof TRIAGE_LEVELS)[number];

export const HEALTH_CONSENT_SCOPES = [
  'profile',
  'measurement',
  'assessment',
  'ai_processing',
] as const;
export type HealthConsentScope = (typeof HEALTH_CONSENT_SCOPES)[number];

export interface TriageDecision {
  level: TriageLevel;
  reasonCodes: string[];
  message: string;
  ruleVersion: string;
}

export interface TriageInput {
  symptoms: Array<{ code: string; severity: string; course: string }>;
}

export interface SafetyTriagePort {
  evaluate(input: TriageInput): Promise<TriageDecision>;
}

export const SAFETY_TRIAGE_PORT = Symbol('SAFETY_TRIAGE_PORT');

export interface PublicHealthKnowledgeQuery {
  query: string;
  audience?: string;
  limit: number;
}

export interface PublicHealthKnowledgeItem {
  knowledgeId: number;
  version: number;
  title: string;
  excerpt: string;
  sourceName: string;
  sourceUrl: string;
  reviewedAt: string;
  score: number;
}
