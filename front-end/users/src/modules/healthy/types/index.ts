export type BasicInfoKey = "systolic" | "diastolic" | "temperature" | "height" | "weight" | "age";

export type SymptomKey =
    | "headache"
    | "chestTightness"
    | "cough"
    | "stomachache"
    | "fever"
    | "fatigue"
    | "dizziness"
    | "jointPain";

export type HabitKey =
    | "smoking"
    | "drinking"
    | "stayingUpLate"
    | "sedentary"
    | "lackOfExercise"
    | "highSaltDiet"
    | "highSugarDiet"
    | "irregularDiet";

export type DiseaseKey = "hypertension" | "diabetes" | "gastricDisease" | "coronaryDisease";
export type RiskLevel = "low" | "medium" | "high";
export type Probability = "较高" | "中等" | "较低";
export type MedicineType = "OTC" | "prescription";
export type SummaryStatus = "stable" | "attention" | "dangerous";
export type InputValue = string | number;

export interface BasicField {
    key: BasicInfoKey;
    label: string;
    unit: string;
    placeholder: string;
}

export interface OptionItem<T extends string> {
    label: string;
    value: T;
}

export interface BasicInfo {
    systolic: InputValue;
    diastolic: InputValue;
    temperature: InputValue;
    height: InputValue;
    weight: InputValue;
    age: InputValue;
}

export interface MedicalHistory {
    diseases: DiseaseKey[];
    other: string;
}

export interface DiseasePrediction {
    name: string;
    probability: Probability;
}

export interface MedicineSuggestion {
    name: string;
    type: MedicineType;
}

export interface AnalysisSummary {
    status: SummaryStatus;
    message: string;
}

export interface AnalysisResult {
    riskLevel: RiskLevel;
    riskDescription: string;
    predictions: DiseasePrediction[];
    explanation: string[];
    medicines: MedicineSuggestion[];
    suggestions: string[];
    lifestyleSuggestions: string[];
    warningSignals: string[];
    needHospital: boolean;
    emergency: boolean;
    summary: AnalysisSummary;
    generatedAt: string;
}

export interface HealthForm {
    basicInfo: BasicInfo;
    symptoms: SymptomKey[];
    habits: Record<HabitKey, boolean>;
    medicalHistory: MedicalHistory;
    analysis: AnalysisResult;
}

export interface BackendAnalysis {
    riskLevel?: {
        level?: unknown;
        description?: unknown;
    };
    possibleDiseases?: unknown;
    explanation?: unknown;
    medicationSuggestions?: unknown;
    medicalAdvice?: unknown;
    lifestyleSuggestions?: unknown;
    warningSignals?: unknown;
    needHospital?: unknown;
    emergency?: unknown;
    summary?: {
        status?: unknown;
        message?: unknown;
    };
}

export interface HealthyAnalysisRequest {
    userId?: string;
    basicInfo: Record<string, unknown>;
    symptoms: Record<string, unknown> | string[];
    habits: Record<string, unknown>;
    medicalHistory: Record<string, unknown>;
}

export interface HealthyAnalysisResponse {
    userId: string;
    analysis: unknown;
    analysisTime: string;
}
