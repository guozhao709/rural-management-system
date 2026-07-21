<template>
    <FunctionHeader title="农业助手" description="智能分析作物种植建议" />
    <div class="agriculture-page">

        <!-- 顶部区域：标题、作物选择、天气信息 -->
        <section class="section-card">
            <header class="page-header">
                <h1 class="page-title">农业助手</h1>
                <p class="page-subtitle">智能分析作物种植建议</p>
            </header>

            <div class="crop-selector">
                <p class="section-label">请选择作物</p>
                <div class="crop-list">
                    <van-button v-for="crop in cropOptions" :key="crop.key" round class="crop-btn"
                        :type="selectedCrop === crop.label ? 'primary' : 'default'"
                        @click="handleSelectCrop(crop.label)">
                        {{ crop.label }}
                    </van-button>
                </div>
                <div class="crop-input-wrap">
                    <input v-model="cropInput" class="crop-input" type="text" placeholder="请输入作物名称"
                        @input="handleCropInput">
                </div>
                <p class="selected-crop">当前作物：{{ currentCropLabel }}</p>
            </div>

            <div v-if="currentResult" class="weather-card">
                <div class="weather-top">
                    <p class="weather-city">地点：{{ currentResult.weather.location }}</p>
                    <van-tag type="success" size="large">
                        {{ currentResult.weather.condition }}
                    </van-tag>
                </div>
                <p class="weather-temp">{{ currentResult.weather.temperature }}</p>
                <p class="weather-desc">{{ currentResult.weather.forecast }}</p>
            </div>

            <div v-else class="empty-card">
                {{ errorMessage || "请选择作物后点击开始分析" }}
            </div>

            <van-button class="analyze-btn" type="success" block round :loading="isLoading" :disabled="isLoading"
                @click="startAnalysis">
                开始分析
            </van-button>
            <p class="analyze-time">最近分析时间：{{ lastAnalyzeTime }}</p>
        </section>

        <!-- 中部区域：分析结果卡片 -->
        <section v-if="currentResult" class="analysis-section">
            <article v-for="card in analysisCards" :key="card.title" class="analysis-card">
                <h2 class="card-title">{{ card.title }}</h2>
                <ul class="card-list">
                    <li v-for="(item, index) in card.items" :key="`${card.title}-${index}`">
                        {{ item }}
                    </li>
                </ul>
            </article>
        </section>

        <!-- 底部区域：AI 综合种植建议 -->
        <section v-if="currentResult" class="section-card summary-section">
            <div class="summary-head">
                <h2 class="summary-title">AI综合种植建议</h2>
                <van-tag size="large" :type="decisionTagType" class="decision-tag">
                    {{ decisionText }}
                </van-tag>
            </div>
            <ol class="reason-list">
                <li v-for="(reason, index) in currentResult.aiAdvice.reasons" :key="`reason-${index}`">
                    {{ reason }}
                </li>
            </ol>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { getAgricultureInfo, getAgricultureInfoFromDB } from "@/api/modules/agriculture";
import FunctionHeader from "@/components/layout/FunctionHeader.vue";
import { useAgricultureCache } from "@/modules/agriculture/composables/useAgricultureCache";
import { useAgricultureParser } from "@/modules/agriculture/composables/useAgricultureParser";
import { useCropNormalize } from "@/modules/agriculture/composables/useCropNormalize";
import type {
    AdviceLevel,
    AgricultureCacheData,
    AgricultureDbData,
    AnalysisCard,
    CropAnalysis,
    CropOption,
} from "@/modules/agriculture/types";

const cropOptions: CropOption[] = [
    { key: "corn", label: "玉米" },
    { key: "wheat", label: "小麦" },
    { key: "rice", label: "水稻" },
    { key: "tomato", label: "番茄" },
    { key: "cucumber", label: "黄瓜" },
];

const selectedCrop = ref("玉米");
const cropInput = ref("");
const lastAnalyzeTime = ref("--:--");
const isLoading = ref(false);
const errorMessage = ref("");
const currentResult = ref<CropAnalysis | null>(null);
let cropInputTimer: ReturnType<typeof setTimeout> | null = null;
let requestId = 0;
let lookupRequestId = 0;

const { getAgricultureCache, setAgricultureCache } = useAgricultureCache();
const { parseAgricultureText } = useAgricultureParser();
const { normalizeCropName } = useCropNormalize();

const adviceTextMap: Record<AdviceLevel, string> = {
    recommended: "推荐种植",
    careful: "谨慎种植",
    avoid: "不建议种植",
};

const adviceTagTypeMap: Record<AdviceLevel, "success" | "warning" | "danger"> = {
    recommended: "success",
    careful: "warning",
    avoid: "danger",
};

const currentCropLabel = computed(
    () => cropInput.value.trim() ? normalizeCropName(cropInput.value) : selectedCrop.value
);

const decisionText = computed(
    () => adviceTextMap[currentResult.value?.aiAdvice.level ?? "careful"]
);

const decisionTagType = computed(
    () => adviceTagTypeMap[currentResult.value?.aiAdvice.level ?? "careful"]
);

const analysisCards = computed<AnalysisCard[]>(() => {
    if (!currentResult.value) {
        return [];
    }

    return [
        {
            title: "作物介绍",
            items: currentResult.value.cropIntro,
        },
        {
            title: "病害预防",
            items: currentResult.value.diseasePrevention,
        },
        {
            title: "施肥建议",
            items: [currentResult.value.fertilization],
        },
        {
            title: "市场行情",
            items: [currentResult.value.marketTrend],
        },
        {
            title: "天气影响",
            items: [currentResult.value.weatherImpact],
        },
    ];
});

const hasResponseData = (data: unknown) => {
    return !!data && typeof data === "object" && Object.keys(data).length > 0;
};

// 点击选择作物模块的按钮时，从本地存储中读取上一次的分析结果
const loadFromLocalStorage = (cropName: string) => {
    try {
        const cachedData = getAgricultureCache(cropName);
        if (!cachedData) {
            return false;
        }

        currentResult.value = parseAgricultureText(cachedData.text);
        lastAnalyzeTime.value = cachedData.analysisTime || "--:--";
        errorMessage.value = "";
        return true;
    } catch (error) {
        console.warn("解析本地存储数据失败", error);
        currentResult.value = null;
        lastAnalyzeTime.value = "--:--";
        return false;
    }
};

const loadFromDb = async (cropName: string) => {
    const currentLookupRequestId = lookupRequestId + 1;
    lookupRequestId = currentLookupRequestId;

    try {
        const response = await getAgricultureInfoFromDB(cropName);
        if (currentLookupRequestId !== lookupRequestId || response.code !== 200 || !hasResponseData(response.data)) {
            return;
        }

        const data = response.data as AgricultureDbData;
        if (!data.analysis?.text) {
            return;
        }

        const result = parseAgricultureText(data.analysis.text);
        const cacheData: AgricultureCacheData = {
            cropName: data.cropName,
            text: data.analysis.text,
            analysisTime: data.analysis.analysisTime,
        };

        currentResult.value = result;
        lastAnalyzeTime.value = data.analysis.analysisTime || "--:--";
        errorMessage.value = "";
        setAgricultureCache(data.cropName || cropName, cacheData);
    } catch (error) {
        console.warn("获取数据库农业分析失败", error);
    }
};

const loadCropAnalysis = async (cropName: string) => {
    const hasCache = loadFromLocalStorage(cropName);
    if (hasCache) {
        return;
    }

    await loadFromDb(cropName);
};

// 更新分析时间为当前时间，格式为 HH:mm
const updateAnalyzeTime = (analysisTime: string) => {
    lastAnalyzeTime.value = analysisTime;
};

const handleCropInput = () => {
    if (cropInputTimer) {
        clearTimeout(cropInputTimer);
    }

    currentResult.value = null;
    lastAnalyzeTime.value = "--:--";
    errorMessage.value = "";

    cropInputTimer = setTimeout(() => {
        const inputCrop = cropInput.value.trim();

        if (!inputCrop) {
            return;
        }

        selectedCrop.value = normalizeCropName(inputCrop);
        loadCropAnalysis(inputCrop);
    }, 500);
};

// 点击分析按钮时分析结果请求函数
// 接口返回的 data.text 是 JSON 字符串，需要先解析再渲染
const startAnalysis = async () => {
    const currentRequestId = requestId + 1;
    requestId = currentRequestId;

    isLoading.value = true;
    errorMessage.value = "";
    console.log("agriculture.vue: 请求中");

    const cropName = cropInput.value.trim() ? cropInput.value : selectedCrop.value;

    try {
        const response = await getAgricultureInfo(cropName);
        
        if (response.code !== 200) {
            throw new Error(response.message || "获取农业分析失败");
        }

        if (!hasResponseData(response.data)) {
            return;
        }

        const result = parseAgricultureText(response.data?.text);
        if (currentRequestId === requestId) {
            currentResult.value = result;
            const analysisTime = response.data?.analysisTime;
            updateAnalyzeTime(analysisTime || "--:--");

            // 进行本地存储, 目的是在下一次用户点击选择作物模块的按钮时, 可以先从本地存储中读取上一次的分析结果, 以提升用户体验
            setAgricultureCache(cropName, response.data);
        }
    } catch (error) {
        if (currentRequestId === requestId) {
            currentResult.value = null;
            errorMessage.value = error instanceof Error ? error.message : "获取农业分析失败";
        }
    } finally {
        if (currentRequestId === requestId) {
            isLoading.value = false;
        }
    }
};

const handleSelectCrop = (crop: string) => {
    // 清空分析结果
    currentResult.value = null;
    lastAnalyzeTime.value = "--:--";
    cropInput.value = "";

    selectedCrop.value = crop;
    loadCropAnalysis(crop);
};

onBeforeUnmount(() => {
    if (cropInputTimer) {
        clearTimeout(cropInputTimer);
    }
});

</script>

<style scoped lang="scss">
.agriculture-page {
    min-height: 100dvh;
    box-sizing: border-box;
    padding: 14px 12px calc(28px + env(safe-area-inset-bottom));
    overflow-y: auto;
    background:
        radial-gradient(circle at top right, rgba(120, 187, 132, 0.2) 0%, rgba(120, 187, 132, 0) 45%),
        linear-gradient(180deg, #edf7ee 0%, #f6fbf6 42%, #eef6ef 100%);
}

.section-card {
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 6px 18px rgba(29, 82, 42, 0.08);
    padding: 16px;
}

.page-header {
    .page-title {
        margin: 0;
        font-size: 30px;
        line-height: 1.2;
        color: #1f5d2e;
        font-weight: 700;
    }

    .page-subtitle {
        margin: 8px 0 0;
        font-size: 17px;
        color: #4d7058;
        line-height: 1.5;
    }
}

.crop-selector {
    margin-top: 14px;

    .section-label {
        margin: 0;
        font-size: 17px;
        font-weight: 600;
        color: #2a6038;
    }

    .crop-list {
        margin-top: 10px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
    }

    .crop-btn {
        height: 46px;
        border: 1px solid #c9dfce;
        background: #f7fbf8;
    }

    .crop-btn:deep(.van-button__text) {
        font-size: 18px;
        font-weight: 600;
    }

    .crop-btn.van-button--primary {
        border: none;
        background: linear-gradient(90deg, #2f9b4b 0%, #3bad57 100%);
        box-shadow: 0 4px 10px rgba(50, 147, 73, 0.25);
    }

    .crop-input-wrap {
        margin-top: 12px;
    }

    .crop-input {
        width: 100%;
        height: 46px;
        box-sizing: border-box;
        border: 1px solid #c9dfce;
        border-radius: 999px;
        padding: 0 16px;
        background: #fbfefb;
        color: #244f31;
        font-size: 16px;
        line-height: 46px;
        outline: none;
        transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
    }

    .crop-input::placeholder {
        color: #7c9884;
    }

    .crop-input:focus {
        border-color: #3bad57;
        background: #ffffff;
        box-shadow: 0 0 0 3px rgba(59, 173, 87, 0.14);
    }

    .selected-crop {
        margin: 10px 0 0;
        font-size: 16px;
        color: #446952;
    }
}

.weather-card {
    margin-top: 14px;
    border-radius: 14px;
    border: 1px solid #d9eadc;
    padding: 12px;
    background: #f2faf3;

    .weather-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
    }

    .weather-city {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #2d5d39;
    }

    .weather-temp {
        margin: 8px 0 0;
        font-size: 34px;
        line-height: 1;
        font-weight: 700;
        color: #1f6b33;
    }

    .weather-desc {
        margin: 8px 0 0;
        font-size: 16px;
        line-height: 1.6;
        color: #4b6c57;
    }
}

.empty-card {
    margin-top: 14px;
    border-radius: 14px;
    border: 1px solid #d9eadc;
    padding: 18px 12px;
    background: #f2faf3;
    color: #4b6c57;
    font-size: 16px;
    line-height: 1.6;
    text-align: center;
}

.analyze-btn {
    margin-top: 14px;
    height: 48px;
}

.analyze-btn:deep(.van-button__text) {
    font-size: 19px;
    font-weight: 700;
    letter-spacing: 1px;
}

.analyze-time {
    margin: 8px 0 0;
    font-size: 14px;
    color: #67816f;
}

.analysis-section {
    margin-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.analysis-card {
    border-radius: 14px;
    border: 1px solid #dfede2;
    background: #f8fcf8;
    box-shadow: 0 4px 12px rgba(57, 111, 66, 0.06);
    padding: 14px 16px;

    .card-title {
        margin: 0;
        font-size: 21px;
        font-weight: 700;
        color: #1f5f34;
    }

    .card-list {
        margin: 8px 0 0;
        padding-left: 22px;
    }

    .card-list li {
        margin-bottom: 2px;
        font-size: 16px;
        line-height: 1.7;
        color: #355543;
    }
}

.summary-section {
    margin-top: 14px;

    .summary-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
    }

    .summary-title {
        margin: 0;
        font-size: 23px;
        font-weight: 700;
        color: #1f5d2f;
    }

    .decision-tag {
        flex-shrink: 0;
    }

    .decision-tag:deep(.van-tag) {
        padding: 5px 10px;
        font-size: 15px;
        font-weight: 600;
    }

    .reason-list {
        margin: 12px 0 0;
        padding-left: 24px;
    }

    .reason-list li {
        margin-bottom: 4px;
        font-size: 16px;
        line-height: 1.75;
        color: #2f523e;
    }
}
</style>
