export type CropKey = "corn" | "wheat" | "rice" | "tomato" | "cucumber";

export interface CropOption {
    key: CropKey;
    label: string;
}

export interface AnalysisCard {
    title: string;
    items: string[];
}

export interface AgricultureDbAnalysis {
    text?: string;
    analysisTime?: string;
}

export interface AgricultureDbData {
    cropName?: string;
    analysis?: AgricultureDbAnalysis | null;
}

export interface AgricultureCacheData {
    cropName?: string;
    text?: string;
    analysisTime?: string;
}

export type AdviceLevel = "recommended" | "careful" | "avoid";

export interface WeatherInfo {
    location: string;
    condition: string;
    temperature: string;
    forecast: string;
}

export interface AiAdvice {
    level: AdviceLevel;
    reasons: string[];
}

export interface CropAnalysis {
    weather: WeatherInfo;
    cropIntro: string[];
    diseasePrevention: string[];
    fertilization: string;
    marketTrend: string;
    weatherImpact: string;
    aiAdvice: AiAdvice;
}
