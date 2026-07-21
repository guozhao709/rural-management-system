import request from "@/api/request";
import type { ApiResponse } from "@/api/types";

// 登录
export const login = (data: { phone: string, password: string }) : Promise<ApiResponse<any>> => {
  return request.post("/api/v1/user/auth/login", data);
}

// 注册
export const register = (data: { phone: string, password: string, name: string, gender: number, birthday: string, address: string }) : Promise<ApiResponse<any>> => {
  return request.post("/api/v1/user/auth/register", data);
}

// 检查token
export const checkToken = () : Promise<ApiResponse<{success: boolean, message: string}>> => {
  return request.get("/api/v1/user/auth/token/verify");
}

// 修改个人信息
export const updateUserInfo = (data: {id: number, name: string, gender: number, birthday: string, address: string, phone: string, password: string }) : Promise<ApiResponse<any>> => {
  return request.put(`/api/v1/user/info/${data.id}`, data);
}
