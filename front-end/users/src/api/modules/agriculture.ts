import request from "@/api/request";
import type { ApiResponse } from "@/api/types";

export const getAgricultureInfo = (data: string): Promise<ApiResponse<any>> => {
  return request.get(`/api/v1/user/argiculture/info/${data}`, {
    timeout: 180000,
  });
};

export const getAgricultureInfoFromDB = (
  data: string,
): Promise<ApiResponse<any>> => {
  return request.get(`/api/v1/user/argiculture/info/db/${data}`);
 
  
};
