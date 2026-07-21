<template>
    <FunctionHeader title="健康助手" />

    <main class="healthy-page">
        <section class="hero-card">
            <p class="eyebrow">AI Health Assistant</p>
            <h1>健康助手</h1>
            <p class="hero-desc">请输入近期身体情况，AI将为您生成健康分析建议</p>
        </section>

        <section class="section-card">
            <div class="section-head">
                <div>
                    <h2>基础健康指标</h2>
                    <p>填写常用指标，系统将自动计算 BMI</p>
                </div>
                <div class="bmi-pill" :class="bmiStatusClass">
                    <span>BMI</span>
                    <strong>{{ bmiText }}</strong>
                    <em>{{ bmiStatusText }}</em>
                </div>
            </div>

            <div class="indicator-grid">
                <label v-for="item in basicFields" :key="item.key" class="indicator-card">
                    <span>{{ item.label }}</span>
                    <div class="input-wrap">
                        <input
                            v-model="healthForm.basicInfo[item.key]"
                            type="number"
                            inputmode="decimal"
                            :placeholder="item.placeholder"
                        />
                        <em>{{ item.unit }}</em>
                    </div>
                </label>
            </div>
        </section>

        <section class="section-card">
            <div class="section-head simple">
                <div>
                    <h2>当前症状</h2>
                    <p>可多选，选择最近明显出现的身体不适</p>
                </div>
            </div>

            <div class="tag-grid">
                <button
                    v-for="item in symptomOptions"
                    :key="item.value"
                    type="button"
                    class="choice-tag"
                    :class="{ active: healthForm.symptoms.includes(item.value) }"
                    @click="toggleArrayItem(healthForm.symptoms, item.value)"
                >
                    {{ item.label }}
                </button>
            </div>
        </section>

        <section class="section-card">
            <div class="section-head simple">
                <div>
                    <h2>生活习惯</h2>
                    <p>请选择可能影响身体状态的生活习惯</p>
                </div>
            </div>

            <div class="tag-grid">
                <button
                    v-for="item in habitOptions"
                    :key="item.value"
                    type="button"
                    class="choice-tag"
                    :class="{ active: healthForm.habits[item.value] }"
                    @click="healthForm.habits[item.value] = !healthForm.habits[item.value]"
                >
                    {{ item.label }}
                </button>
            </div>
        </section>

        <section class="section-card">
            <div class="section-head simple">
                <div>
                    <h2>既往病史</h2>
                    <p>选择常见疾病，也可以补充其他情况</p>
                </div>
            </div>

            <div class="tag-grid compact">
                <button
                    v-for="item in diseaseOptions"
                    :key="item.value"
                    type="button"
                    class="choice-tag"
                    :class="{ active: healthForm.medicalHistory.diseases.includes(item.value) }"
                    @click="toggleArrayItem(healthForm.medicalHistory.diseases, item.value)"
                >
                    {{ item.label }}
                </button>
            </div>

            <div class="history-input">
                <van-field
                    v-model="healthForm.medicalHistory.other"
                    type="textarea"
                    rows="2"
                    autosize
                    maxlength="80"
                    show-word-limit
                    placeholder="请输入其他既往病史"
                />
            </div>
        </section>

        <section class="result-section">
            <div class="section-title-row">
                <h2>AI分析结果</h2>
                <span>{{ healthForm.analysis.generatedAt || "待分析" }}</span>
            </div>

            <div v-if="!hasAnalyzed" class="empty-result">
                <strong>等待健康分析</strong>
                <p>填写身体指标并选择症状后，点击下方按钮生成结构化健康建议。</p>
            </div>

            <template v-else>
                <article class="risk-card" :class="riskClass">
                    <div>
                        <p>风险等级</p>
                        <strong>{{ riskText }}</strong>
                        <span>{{ healthForm.analysis.riskDescription }}</span>
                    </div>
                    <van-tag round size="large" :type="riskTagType">{{ riskText }}</van-tag>
                </article>

                <article class="summary-card" :class="summaryClass">
                    <p>{{ summaryStatusText }}</p>
                    <strong>{{ healthForm.analysis.summary.message }}</strong>
                </article>

                <article class="result-card">
                    <h3>病情预测</h3>
                    <ul class="result-list">
                        <li v-for="item in healthForm.analysis.predictions" :key="item.name">
                            <span>{{ item.name }}</span>
                            <van-tag plain round :type="getProbabilityTagType(item.probability)">
                                {{ item.probability }}
                            </van-tag>
                        </li>
                    </ul>
                </article>

                <article class="result-card">
                    <h3>病情解释</h3>
                    <ul class="result-list">
                        <li v-for="item in healthForm.analysis.explanation" :key="item">
                            <span>{{ item }}</span>
                        </li>
                    </ul>
                </article>

                <article class="result-card">
                    <h3>建议用药</h3>
                    <div class="medicine-tags">
                        <van-tag
                            v-for="item in healthForm.analysis.medicines"
                            :key="`${item.name}-${item.type}`"
                            round
                            plain
                            :type="item.type === 'prescription' ? 'warning' : 'primary'"
                            size="large"
                        >
                            {{ item.name }}
                        </van-tag>
                    </div>
                </article>

                <article class="result-card">
                    <h3>就医建议</h3>
                    <ul class="result-list advice">
                        <li v-for="item in healthForm.analysis.suggestions" :key="item">
                            <span>{{ item }}</span>
                        </li>
                    </ul>
                </article>

                <article class="result-card">
                    <h3>生活建议</h3>
                    <ul class="result-list lifestyle">
                        <li v-for="item in healthForm.analysis.lifestyleSuggestions" :key="item">
                            <span>{{ item }}</span>
                        </li>
                    </ul>
                </article>

                <article v-if="healthForm.analysis.warningSignals.length" class="result-card warning-card">
                    <h3>警惕信号</h3>
                    <ul class="result-list warning">
                        <li v-for="item in healthForm.analysis.warningSignals" :key="item">
                            <span>{{ item }}</span>
                        </li>
                    </ul>
                </article>
            </template>
        </section>
    </main>

    <div class="fixed-action">
        <van-button
            block
            round
            type="primary"
            class="analyze-button"
            :loading="isAnalyzing"
            loading-text="AI分析中"
            @click="startAnalysis"
        >
            开始AI健康分析
        </van-button>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { showNotify } from "vant";
import { getHealthyAnalysis } from "@/api/modules/healthy";
import FunctionHeader from "@/components/layout/FunctionHeader.vue";
import { useHealthyAnalysis } from "@/modules/healthy/composables/useHealthyAnalysis";
import type { HealthForm } from "@/modules/healthy/types";

const {
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
} = useHealthyAnalysis();

const healthForm = reactive<HealthForm>({
    basicInfo: {
        systolic: "",
        diastolic: "",
        temperature: "",
        height: "",
        weight: "",
        age: "",
    },
    symptoms: [],
    habits: {
        smoking: false,
        drinking: false,
        stayingUpLate: false,
        sedentary: false,
        lackOfExercise: false,
        highSaltDiet: false,
        highSugarDiet: false,
        irregularDiet: false,
    },
    medicalHistory: {
        diseases: [],
        other: "",
    },
    analysis: emptyAnalysis(),
});

const isAnalyzing = ref(false);
const hasAnalyzed = ref(false);

const bmiValue = computed(() => {
    const height = toNumber(healthForm.basicInfo.height);
    const weight = toNumber(healthForm.basicInfo.weight);

    if (!height || !weight) {
        return null;
    }

    const heightMeter = height / 100;
    return weight / heightMeter ** 2;
});

const bmiText = computed(() => {
    return bmiValue.value ? bmiValue.value.toFixed(1) : "--";
});

const bmiStatusText = computed(() => {
    if (!bmiValue.value) {
        return "待填写";
    }

    if (bmiValue.value < 18.5) {
        return "偏瘦";
    }

    if (bmiValue.value < 24) {
        return "正常";
    }

    return "超重";
});

const bmiStatusClass = computed(() => {
    if (!bmiValue.value) {
        return "empty";
    }

    if (bmiValue.value < 18.5) {
        return "thin";
    }

    if (bmiValue.value < 24) {
        return "normal";
    }

    return "overweight";
});

const riskText = computed(() => riskTextMap[healthForm.analysis.riskLevel]);
const riskTagType = computed(() => riskTagTypeMap[healthForm.analysis.riskLevel]);
const riskClass = computed(() => `risk-${healthForm.analysis.riskLevel}`);
const summaryClass = computed(() => `summary-${healthForm.analysis.summary.status}`);
const summaryStatusText = computed(() => summaryTextMap[healthForm.analysis.summary.status]);

const validateBeforeSubmit = () => {
    if (!toInputText(healthForm.basicInfo.age)) {
        showNotify({ type: "warning", message: "请填写年龄", position: "top" });
        return false;
    }

    if (!healthForm.symptoms.length) {
        showNotify({ type: "warning", message: "请选择至少一个当前症状", position: "top" });
        return false;
    }

    return true;
};

const startAnalysis = async () => {
    if (isAnalyzing.value || !validateBeforeSubmit()) {
        return;
    }

    isAnalyzing.value = true;

    try {
        const response = await getHealthyAnalysis({
            userId: getUserId(),
            basicInfo: {
                ...buildLabeledBasicInfo(healthForm),
                BMI: bmiValue.value ? bmiValue.value.toFixed(1) : "未填写",
            },
            symptoms: healthForm.symptoms.map((item) => getLabelByValue(symptomOptions, item)),
            habits: buildSelectedHabits(healthForm),
            medicalHistory: buildMedicalHistory(healthForm),
        });

        if (!response.code || response.code !== 200) {
            throw new Error(response.message || "健康分析失败");
        }

        Object.assign(healthForm.analysis, normalizeAnalysis(response.data?.analysis, response.data?.analysisTime ?? ""));
        hasAnalyzed.value = true;
        showNotify({ type: "success", message: "健康分析已生成", position: "top" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "健康分析失败，请稍后重试";
        showNotify({ type: "danger", message, position: "top" });
    } finally {
        isAnalyzing.value = false;
    }
};
</script>

<style scoped lang="scss">
.healthy-page {
    min-height: 100dvh;
    box-sizing: border-box;
    padding: 12px 12px calc(98px + env(safe-area-inset-bottom));
    background: linear-gradient(180deg, #eaf8f5 0%, #f7fbfb 46%, #eef8f6 100%);
    color: #183b3d;
}

.hero-card,
.section-card,
.result-card,
.risk-card,
.summary-card,
.empty-result {
    border: 1px solid rgba(93, 177, 169, 0.16);
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 8px 24px rgba(37, 105, 104, 0.08);
}

.hero-card {
    border-radius: 22px;
    padding: 20px 18px;

    .eyebrow {
        margin: 0;
        font-size: 13px;
        font-weight: 700;
        color: #278a82;
    }

    h1 {
        margin: 8px 0 0;
        font-size: 30px;
        line-height: 1.2;
        font-weight: 800;
        color: #123f44;
    }

    .hero-desc {
        margin: 10px 0 0;
        font-size: 16px;
        line-height: 1.6;
        color: #547174;
    }
}

.section-card,
.result-card {
    margin-top: 12px;
    border-radius: 18px;
    padding: 16px;
}

.section-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;

    h2 {
        margin: 0;
        font-size: 20px;
        line-height: 1.25;
        font-weight: 800;
        color: #173f42;
    }

    p {
        margin: 6px 0 0;
        font-size: 14px;
        line-height: 1.45;
        color: #6a8588;
    }

    &.simple {
        display: block;
    }
}

.bmi-pill {
    flex: 0 0 auto;
    min-width: 82px;
    border-radius: 16px;
    padding: 8px 10px;
    text-align: center;
    background: #eef7f6;

    span,
    em {
        display: block;
        font-size: 12px;
        line-height: 1.25;
        color: #6b8587;
        font-style: normal;
    }

    strong {
        display: block;
        margin: 2px 0;
        font-size: 22px;
        line-height: 1.1;
        color: #2b8f86;
    }

    &.thin strong {
        color: #4c8fcc;
    }

    &.normal strong {
        color: #20966f;
    }

    &.overweight strong {
        color: #d28a22;
    }
}

.indicator-grid {
    margin-top: 14px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.indicator-card {
    min-width: 0;
    border-radius: 16px;
    padding: 12px;
    background: #f3faf9;

    > span {
        display: block;
        margin-bottom: 8px;
        font-size: 15px;
        font-weight: 700;
        color: #2c5b5f;
    }
}

.input-wrap {
    display: flex;
    align-items: center;
    min-height: 42px;
    border-radius: 13px;
    border: 1px solid #d7ece9;
    background: #ffffff;
    padding: 0 10px;

    input {
        min-width: 0;
        flex: 1;
        border: 0;
        outline: 0;
        background: transparent;
        font-size: 18px;
        font-weight: 700;
        color: #173f42;
    }

    input::placeholder {
        color: #b5c7c8;
        font-weight: 500;
    }

    em {
        flex-shrink: 0;
        margin-left: 4px;
        font-size: 12px;
        color: #789092;
        font-style: normal;
    }
}

.tag-grid {
    margin-top: 14px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;

    &.compact {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

.choice-tag {
    min-width: 0;
    height: 42px;
    border: 1px solid #d5ebe8;
    border-radius: 999px;
    background: #f7fbfb;
    color: #355f62;
    font-size: 15px;
    font-weight: 700;
    line-height: 1;
    transition:
        background-color 0.16s ease,
        border-color 0.16s ease,
        color 0.16s ease,
        box-shadow 0.16s ease;

    &.active {
        border-color: #2aa99b;
        background: #dff6f2;
        color: #0c756e;
        box-shadow: 0 4px 10px rgba(42, 169, 155, 0.14);
    }
}

.history-input {
    margin-top: 12px;
    overflow: hidden;
    border-radius: 16px;
    border: 1px solid #d7ece9;
    background: #ffffff;

    :deep(.van-cell) {
        padding: 10px 12px;
        background: transparent;
    }

    :deep(.van-field__control) {
        font-size: 15px;
        line-height: 1.6;
        color: #173f42;
    }
}

.result-section {
    margin-top: 16px;
}

.section-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 0 4px;

    h2 {
        margin: 0;
        font-size: 22px;
        font-weight: 800;
        color: #173f42;
    }

    span {
        flex-shrink: 0;
        font-size: 13px;
        color: #789092;
    }
}

.empty-result {
    margin-top: 10px;
    border-radius: 18px;
    padding: 18px 16px;
    text-align: center;

    strong {
        display: block;
        font-size: 18px;
        color: #22494d;
    }

    p {
        margin: 8px 0 0;
        font-size: 14px;
        line-height: 1.6;
        color: #6d8588;
    }
}

.risk-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 10px;
    border-radius: 18px;
    padding: 16px;

    p {
        margin: 0 0 6px;
        font-size: 14px;
        color: #6d8588;
    }

    strong {
        display: block;
        font-size: 28px;
        line-height: 1.1;
        font-weight: 800;
    }

    span {
        display: block;
        margin-top: 8px;
        font-size: 14px;
        line-height: 1.5;
        color: #5a7375;
    }

    &.risk-low strong {
        color: #20966f;
    }

    &.risk-medium strong {
        color: #d59725;
    }

    &.risk-high strong {
        color: #d94b42;
    }
}

.summary-card {
    margin-top: 12px;
    border-radius: 18px;
    padding: 14px 16px;

    p {
        margin: 0 0 6px;
        font-size: 14px;
        font-weight: 700;
        color: #278a82;
    }

    strong {
        display: block;
        font-size: 16px;
        line-height: 1.6;
        color: #22494d;
    }

    &.summary-attention p {
        color: #c4841f;
    }

    &.summary-dangerous p {
        color: #d94b42;
    }
}

.result-card {
    h3 {
        margin: 0 0 10px;
        font-size: 18px;
        font-weight: 800;
        color: #22494d;
    }
}

.result-list {
    margin: 0;
    padding: 0;
    list-style: none;

    li {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 0 8px 18px;
        border-bottom: 1px solid #eef5f4;
        font-size: 15px;
        line-height: 1.45;
        color: #435f62;
    }

    li:last-child {
        border-bottom: 0;
    }

    li::before {
        position: absolute;
        left: 0;
        top: 16px;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #2aa99b;
        content: "";
    }

    li > span:first-child {
        min-width: 0;
        flex: 1;
    }

    &.advice li::before {
        background: #4c8fcc;
    }

    &.lifestyle li::before {
        background: #20966f;
    }

    &.warning li::before {
        background: #d94b42;
    }
}

.warning-card {
    border-color: rgba(217, 75, 66, 0.2);
}

.medicine-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    :deep(.van-tag) {
        padding: 7px 12px;
        font-size: 14px;
    }
}

.fixed-action {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 10;
    box-sizing: border-box;
    padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
    background: rgba(247, 251, 251, 0.9);
    backdrop-filter: blur(10px);
}

.analyze-button {
    height: 52px;
    border: 0;
    background: linear-gradient(90deg, #21a99a 0%, #2f8fcd 100%);
    box-shadow: 0 10px 22px rgba(31, 143, 136, 0.25);

    :deep(.van-button__text) {
        font-size: 17px;
        font-weight: 800;
    }
}

@media (max-width: 360px) {
    .tag-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));

        &.compact {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }

    .choice-tag {
        font-size: 14px;
    }
}
</style>
