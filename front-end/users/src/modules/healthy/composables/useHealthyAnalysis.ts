import type {
    AnalysisResult,
    BackendAnalysis,
    BasicField,
    DiseaseKey,
    DiseasePrediction,
    HabitKey,
    HealthForm,
    InputValue,
    MedicineSuggestion,
    MedicineType,
    OptionItem,
    Probability,
    RiskLevel,
    SummaryStatus,
    SymptomKey,
} from "@/modules/healthy/types";

export const basicFields: BasicField[] = [
    { key: "systolic", label: "收缩压", unit: "mmHg", placeholder: "120" },
    { key: "diastolic", label: "舒张压", unit: "mmHg", placeholder: "80" },
    { key: "temperature", label: "体温", unit: "°C", placeholder: "36.5" },
    { key: "height", label: "身高", unit: "cm", placeholder: "170" },
    { key: "weight", label: "体重", unit: "kg", placeholder: "65" },
    { key: "age", label: "年龄", unit: "岁", placeholder: "60" },
];

export const symptomOptions: OptionItem<SymptomKey>[] = [
    { label: "头痛", value: "headache" },
    { label: "胸闷", value: "chestTightness" },
    { label: "咳嗽", value: "cough" },
    { label: "肚子痛", value: "stomachache" },
    { label: "发热", value: "fever" },
    { label: "乏力", value: "fatigue" },
    { label: "头晕", value: "dizziness" },
    { label: "关节痛", value: "jointPain" },
];

export const habitOptions: OptionItem<HabitKey>[] = [
    { label: "抽烟", value: "smoking" },
    { label: "饮酒", value: "drinking" },
    { label: "熬夜", value: "stayingUpLate" },
    { label: "久坐", value: "sedentary" },
    { label: "缺乏运动", value: "lackOfExercise" },
    { label: "高盐饮食", value: "highSaltDiet" },
    { label: "高糖饮食", value: "highSugarDiet" },
    { label: "饮食不规律", value: "irregularDiet" },
];

export const diseaseOptions: OptionItem<DiseaseKey>[] = [
    { label: "高血压", value: "hypertension" },
    { label: "糖尿病", value: "diabetes" },
    { label: "胃病", value: "gastricDisease" },
    { label: "冠心病", value: "coronaryDisease" },
];

export const riskTextMap: Record<RiskLevel, string> = {
    low: "低风险",
    medium: "中风险",
    high: "高风险",
};

export const riskTagTypeMap: Record<RiskLevel, "success" | "warning" | "danger"> = {
    low: "success",
    medium: "warning",
    high: "danger",
};

export const summaryTextMap: Record<SummaryStatus, string> = {
    stable: "状态稳定",
    attention: "需要关注",
    dangerous: "明显风险",
};

export const emptyAnalysis = (): AnalysisResult => ({
    riskLevel: "low",
    riskDescription: "",
    predictions: [],
    explanation: [],
    medicines: [],
    suggestions: [],
    lifestyleSuggestions: [],
    warningSignals: [],
    needHospital: false,
    emergency: false,
    summary: {
        status: "stable",
        message: "",
    },
    generatedAt: "",
});

export const toInputText = (value: InputValue) => String(value ?? "").trim();

export const toNumber = (value: InputValue) => Number.parseFloat(toInputText(value));

export const toggleArrayItem = <T extends string>(target: T[], value: T) => {
    const index = target.indexOf(value);
    if (index > -1) {
        target.splice(index, 1);
        return;
    }

    target.push(value);
};

export const getProbabilityTagType = (probability: Probability) => {
    if (probability === "较高") {
        return "danger";
    }

    if (probability === "中等") {
        return "warning";
    }

    return "success";
};

export const getLabelByValue = <T extends string>(options: OptionItem<T>[], value: T) => {
    return options.find((item) => item.value === value)?.label ?? value;
};

export const buildLabeledBasicInfo = (healthForm: HealthForm) => {
    return basicFields.reduce<Record<string, string>>((result, item) => {
        const value = toInputText(healthForm.basicInfo[item.key]);
        if (value) {
            result[item.label] = `${value}${item.unit}`;
        }
        return result;
    }, {});
};

export const buildSelectedHabits = (healthForm: HealthForm) => {
    return habitOptions.reduce<Record<string, boolean>>((result, item) => {
        if (healthForm.habits[item.value]) {
            result[item.label] = true;
        }
        return result;
    }, {});
};

export const buildMedicalHistory = (healthForm: HealthForm) => {
    return {
        常见疾病: healthForm.medicalHistory.diseases.map((item) => getLabelByValue(diseaseOptions, item)),
        其他病史: healthForm.medicalHistory.other.trim(),
    };
};

export const getUserId = () => {
    try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
        return typeof userInfo.phone === "string" && userInfo.phone ? userInfo.phone : "anonymous";
    } catch {
        return "anonymous";
    }
};

const isRiskLevel = (value: unknown): value is RiskLevel => {
    return value === "low" || value === "medium" || value === "high";
};

const isProbability = (value: unknown): value is Probability => {
    return value === "较高" || value === "中等" || value === "较低";
};

const isMedicineType = (value: unknown): value is MedicineType => {
    return value === "OTC" || value === "prescription";
};

const isSummaryStatus = (value: unknown): value is SummaryStatus => {
    return value === "stable" || value === "attention" || value === "dangerous";
};

const normalizeStringArray = (value: unknown, fallback: string[] = []) => {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "") : fallback;
};

const normalizePredictions = (value: unknown): DiseasePrediction[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item) => {
            if (!item || typeof item !== "object") {
                return null;
            }

            const source = item as Record<string, unknown>;
            const name = typeof source.name === "string" ? source.name.trim() : "";
            const probability = isProbability(source.probability) ? source.probability : "中等";

            return name ? { name, probability } : null;
        })
        .filter((item): item is DiseasePrediction => Boolean(item));
};

const normalizeMedicines = (value: unknown): MedicineSuggestion[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item) => {
            if (!item || typeof item !== "object") {
                return null;
            }

            const source = item as Record<string, unknown>;
            const name = typeof source.name === "string" ? source.name.trim() : "";
            const type = isMedicineType(source.type) ? source.type : "OTC";

            return name ? { name, type } : null;
        })
        .filter((item): item is MedicineSuggestion => Boolean(item));
};

export const normalizeAnalysis = (value: unknown, analysisTime: string): AnalysisResult => {
    const source = (value && typeof value === "object" ? value : {}) as BackendAnalysis;
    const riskLevel = isRiskLevel(source.riskLevel?.level) ? source.riskLevel.level : "low";
    const summaryStatus = isSummaryStatus(source.summary?.status) ? source.summary.status : "stable";
    const summaryMessage =
        typeof source.summary?.message === "string" && source.summary.message.trim()
            ? source.summary.message
            : "请结合身体变化持续观察，必要时咨询医生。";
    const predictions = normalizePredictions(source.possibleDiseases);
    const explanation = normalizeStringArray(source.explanation);
    const medicines = normalizeMedicines(source.medicationSuggestions);
    const suggestions = normalizeStringArray(source.medicalAdvice);
    const lifestyleSuggestions = normalizeStringArray(source.lifestyleSuggestions);

    return {
        riskLevel,
        riskDescription: typeof source.riskLevel?.description === "string" ? source.riskLevel.description : "",
        predictions: predictions.length ? predictions : [{ name: "暂未判断明确疾病", probability: "较低" }],
        explanation: explanation.length ? explanation : ["当前信息不足，建议补充体温、血压、症状持续时间等信息。"],
        medicines,
        suggestions: suggestions.length ? suggestions : ["持续观察身体变化", "如症状加重请及时就医"],
        lifestyleSuggestions: lifestyleSuggestions.length ? lifestyleSuggestions : ["保持规律作息", "清淡饮食并适量饮水"],
        warningSignals: normalizeStringArray(source.warningSignals),
        needHospital: typeof source.needHospital === "boolean" ? source.needHospital : false,
        emergency: typeof source.emergency === "boolean" ? source.emergency : false,
        summary: {
            status: summaryStatus,
            message: summaryMessage,
        },
        generatedAt: analysisTime ? `最近分析 ${analysisTime}` : "最近分析已完成",
    };
};

export const useHealthyAnalysis = () => {
    return {
        basicFields,
        symptomOptions,
        habitOptions,
        diseaseOptions,
        riskTextMap,
        riskTagTypeMap,
        summaryTextMap,
        emptyAnalysis,
        toInputText,
        toNumber,
        toggleArrayItem,
        getProbabilityTagType,
        getLabelByValue,
        buildLabeledBasicInfo,
        buildSelectedHabits,
        buildMedicalHistory,
        getUserId,
        normalizeAnalysis,
    };
};
