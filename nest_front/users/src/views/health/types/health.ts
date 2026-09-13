export type HealthConsentScope = 'profile' | 'measurement' | 'assessment' | 'ai_processing'
export type MeasurementType = 'blood_pressure' | 'body_temperature' | 'heart_rate' | 'body_weight' | 'body_height'
export type MeasurementSource = 'self_reported' | 'manual_device' | 'connected_device'
export type TriageLevel = 'emergency' | 'urgent' | 'routine' | 'self_care' | 'insufficient'

export interface HealthConsent { id: string; noticeVersion: string; scopes: HealthConsentScope[]; grantedAt: string }
export interface HealthProfile { medicalHistory: string | null; allergies: string | null; specialPopulation: string | null; updatedAt: string | null }
export interface HealthMeasurement { id: string; type: MeasurementType; source: MeasurementSource; measuredAt: string; values: Record<string, number | string>; createdAt: string }
export interface HealthAssessmentResult { schemaVersion: string; triage: HealthTriage; summary: string; factors: string[]; nextActions: string[]; selfCare: string[]; warningSignals: string[]; knowledgeReferences: HealthKnowledgeReference[]; limitations: string[]; aiGenerated: boolean; generatedAt: string }
export interface HealthTriage { level: TriageLevel; reasonCodes: string[]; message: string }
export interface HealthAssessment { id: string; status: 'succeeded' | 'failed' | 'processing'; triage: HealthTriage; result: HealthAssessmentResult; aiGenerated: boolean; ruleVersion: string; createdAt: string; completedAt: string | null }
export interface HealthKnowledgeReference { knowledgeId: number; version: number; title: string }
export interface HealthKnowledge { knowledgeId: number; version: number; title: string; excerpt: string; sourceName: string; sourceUrl: string; reviewedAt: string; score: number }
export interface PageResult<T> { list: T[]; total: number; page: number; pageSize: number }
export interface CreateMeasurementInput { type: MeasurementType; source: MeasurementSource; measuredAt: string; values: Record<string, number | string> }
export interface CreateAssessmentInput { idempotencyKey: string; symptoms: Array<{ code: string; severity: 'mild' | 'moderate' | 'severe'; startedAt: string; course: 'new' | 'intermittent' | 'persistent' }>; otherDetails?: string; measurementIds: string[] }
