import axios from "axios";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import router from "@/router/index";

const http = axios.create({
  baseURL: "http://127.0.0.1:3000",
  timeout: 15000,
});

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    NProgress.start();

    const token = localStorage.getItem("token");
    const whiteList = ["/user/auth/login", "/user/auth/register"];
    if (config.url && !whiteList.includes(config.url) && token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    NProgress.done();
    return response.data;
  },

  (error) => {
    NProgress.done();
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");

      if (window.location.pathname !== "/login") {
        router.push("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default http;
