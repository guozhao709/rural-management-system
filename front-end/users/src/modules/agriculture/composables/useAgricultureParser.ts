import type { AdviceLevel, CropAnalysis } from "@/modules/agriculture/types";

const normalizeStringArray = (value: unknown): string[] => {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
};

const normalizeAdviceLevel = (value: unknown): AdviceLevel => {
    return value === "recommended" || value === "careful" || value === "avoid" ? value : "careful";
};

const normalizeAnalysis = (value: any): CropAnalysis => {
    return {
        weather: {
            location: typeof value?.weather?.location === "string" ? value.weather.location : "",
            condition: typeof value?.weather?.condition === "string" ? value.weather.condition : "",
            temperature: typeof value?.weather?.temperature === "string" ? value.weather.temperature : "",
            forecast: typeof value?.weather?.forecast === "string" ? value.weather.forecast : "",
        },
        cropIntro: normalizeStringArray(value?.cropIntro),
        diseasePrevention: normalizeStringArray(value?.diseasePrevention),
        fertilization: typeof value?.fertilization === "string" ? value.fertilization : "",
        marketTrend: typeof value?.marketTrend === "string" ? value.marketTrend : "",
        weatherImpact: typeof value?.weatherImpact === "string" ? value.weatherImpact : "",
        aiAdvice: {
            level: normalizeAdviceLevel(value?.aiAdvice?.level),
            reasons: normalizeStringArray(value?.aiAdvice?.reasons),
        },
    };
};

export const parseAgricultureText = (text: unknown): CropAnalysis => {
    if (typeof text !== "string") {
        throw new Error("接口返回的 data.text 不是字符串");
    }

    return normalizeAnalysis(JSON.parse(text));
};

export const useAgricultureParser = () => {
    return {
        parseAgricultureText,
    };
};
