import request from "@/api/request";
import type { ApiResponse } from "@/api/types";

// Banner articles (轮播通知)
export const getBannerArticles = (): Promise<ApiResponse<any>> => {
  return request.get("/api/v1/articles/banner");
};

// Article list (paginated, published only)
export const getArticles = (params: {
  page?: number;
  pageSize?: number;
  category?: string;
}): Promise<ApiResponse<any>> => {
  return request.get("/api/v1/articles", { params });
};

// Article detail (auto-increments views)
export const getArticleDetail = (
  id: string | number,
): Promise<ApiResponse<any>> => {
  return request.get(`/api/v1/articles/${id}`);
};
