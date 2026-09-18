import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  {
    path: '/login',
    name: 'user-login',
    component: () => import('../views/auth/UserLoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'user-register',
    component: () => import('../views/auth/UserRegisterView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/home',
    name: 'user-home',
    component: () => import('../views/home/UserHomeView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/agriculture',
    name: 'user-agriculture',
    component: () => import('../views/agriculture/index.vue'),
    meta: { requiresAuth: true },
  },
  { path: '/:pathMatch(.*)*', redirect: '/home' },
]
