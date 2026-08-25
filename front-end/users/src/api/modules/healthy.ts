import request from "@/api/request";
import type { ApiResponse } from "@/api/types";
import type { CreateAssessmentRequest, HealthAssessmentResult } from "@/modules/healthy/types";

// The authenticated request client provides identity; health requests never carry a user id or phone.
export const createHealthAssessment = (data: CreateAssessmentRequest): Promise<ApiResponse<HealthAssessmentResult>> => request.post("/api/v2/health/assessments", data);
export const getCurrentHealthConsent = (): Promise<ApiResponse<{ scopes: string[]; noticeVersion: string } | null>> => request.get("/api/v2/health/consents/current");
export const grantHealthConsent = (data: { noticeVersion: string; scopes: string[] }) => request.post("/api/v2/health/consents", data);
export const revokeHealthConsent = () => request.delete("/api/v2/health/consents/current");
