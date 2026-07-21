import { createRouter, createWebHashHistory } from "vue-router";

import main from "@/views/home/main.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    // 登录页
    {
      path: "/login",
      component: () => import("@/views/login/index.vue"),
    },
    // 首页
    {
      path: "/",
      component: main,
      redirect: "/home",
      children: [
        {
          path: "home",
          component: () => import("@/views/home/home.vue"),
        },
        {
          path: "services",
          component: () => import("@/views/home/services.vue"),
        },
        {
          path: "function",
          redirect: "/services",
        },
        {
          path: "ai",
          component: () => import("@/views/home/agent.vue"),
        },
        {
          path: "user",
          component: () => import("@/views/home/user.vue"),
        },
      ],
    },
    // 沉浸式服务页面
    {
      path: "/services/healthy",
      alias: "/function/healthy",
      component: () => import("@/modules/healthy/views/index.vue"),
    },
    {
      path: "/services/game",
      alias: "/function/game",
      component: () => import("@/modules/game/views/index.vue"),
    },
    {
      path: "/services/hospital",
      alias: "/function/hospital",
      component: () => import("@/modules/hospital/views/index.vue"),
    },
    {
      path: "/services/agriculture",
      alias: "/function/agriculture",
      component: () => import("@/modules/agriculture/views/index.vue"),
    },
    {
      path: "/services/villageCommittee",
      alias: "/function/villageCommittee",
      component: () => import("@/modules/village/views/index.vue"),
    },
    {
      path: "/article/:id",
      component: () => import("@/modules/article/article.vue"),
    },
  ],
});

export default router;
