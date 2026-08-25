export type TriageLevel = "emergency" | "urgent" | "routine" | "self_care" | "insufficient";
export interface HealthAssessmentResult {
  schemaVersion: "1.0";
  triage: { level: TriageLevel; reasonCodes: string[]; message: string };
  summary: string; factors: string[]; nextActions: string[]; selfCare: string[]; warningSignals: string[];
  knowledgeReferences: Array<{ knowledgeId: number; version: number; title: string; sourceName: string }>;
  limitations: string[]; aiGenerated: true; generatedAt: string;
}
export interface CreateAssessmentRequest { idempotencyKey: string; symptoms: Array<{ code: string; severity: "mild" | "moderate" | "severe"; startedAt: string; course: "new" | "intermittent" | "persistent" }>; otherDetails?: string; measurementIds?: string[]; }
export const isHealthAssessmentResult = (value: unknown): value is HealthAssessmentResult => {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<HealthAssessmentResult>;
  return result.schemaVersion === "1.0" && result.aiGenerated === true && Boolean(result.triage) && Array.isArray(result.limitations) && ["emergency", "urgent", "routine", "self_care", "insufficient"].includes(result.triage.level ?? "");
};
