import { normalizeCropName } from "@/modules/agriculture/composables/useCropNormalize";
import type { AgricultureCacheData } from "@/modules/agriculture/types";

export const getAgricultureCache = (cropName: string): AgricultureCacheData | null => {
    const normalizedCropName = normalizeCropName(cropName);
    if (!normalizedCropName) {
        return null;
    }

    const storedData = localStorage.getItem(normalizedCropName);
    if (!storedData) {
        return null;
    }

    return JSON.parse(storedData);
};

export const setAgricultureCache = (cropName: string, data: AgricultureCacheData) => {
    const cacheCropName = data.cropName || cropName;
    const normalizedCropName = normalizeCropName(cacheCropName);
    if (!normalizedCropName) {
        return;
    }

    localStorage.setItem(normalizedCropName, JSON.stringify(data));
};

export const useAgricultureCache = () => {
    return {
        getAgricultureCache,
        setAgricultureCache,
    };
};
