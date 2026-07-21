import request from "@/api/request";
import type { ApiResponse } from "@/api/types";
import type {
  HealthyAnalysisRequest,
  HealthyAnalysisResponse,
} from "@/modules/healthy/types";

// 获取个人健康分析
export const getHealthyAnalysis = (
  data: HealthyAnalysisRequest,
): Promise<ApiResponse<HealthyAnalysisResponse>> => {
  return request.post("/api/v1/user/healthy/info", data, { timeout: 180000 });
};

// 从数据库中获取最新的个人健康分析
export const getHealthyAnalysisFromDB = (data: {
  phone: string;
}): Promise<ApiResponse<HealthyAnalysisResponse>> => {
  return request.post("/api/v1/user/info/healthy", data);
};
