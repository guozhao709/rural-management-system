import { createRouter, createWebHashHistory } from "vue-router";

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/pages/login/index.vue"),
    },
    {
      path: "/login",
      component: () => import("@/pages/login/index.vue"),
    },
    {
      path: "/home",
      component: () => import("@/pages/home/index.vue"),
      children: [
        {
          path: "/dashboard",
          component: () => import("@/pages/aside/dashboard.vue"),
        },
        {
          path: "/admin",
          component: () => import("@/pages/aside/administrator.vue"),
        },
        {
          path: "/villagers",
          component: () => import("@/pages/aside/villagers.vue"),
        },
        {
          path: "/chat",
          component: () => import("@/pages/aside/chat.vue"),
        },
        {
          path: "/settings",
          component: () => import("@/pages/aside/settings.vue"),
        },
        {
          path: "/article",
          component: () => import("@/pages/aside/article.vue"),
        },
      ],
    },
  ],
});
