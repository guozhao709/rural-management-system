import type { RouteRecordRaw } from 'vue-router'
export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'admin-login', component: () => import('../views/auth/AdminLoginView.vue'), meta: { guestOnly: true } },
  { path: '/dashboard', name: 'admin-dashboard', component: () => import('../views/dashboard/AdminDashboardView.vue'), meta: { requiresAuth: true } },
  { path: '/administrators', name: 'admin-management', component: () => import('../views/dashboard/AdminManagementView.vue'), meta: { requiresAuth: true, requiredRole: 'super_admin' } },
  { path: '/agriculture', name: 'admin-agriculture', component: () => import('../views/agriculture/index.vue'), meta: { requiresAuth: true } },
  { path: '/forbidden', name: 'admin-forbidden', component: () => import('../views/dashboard/ForbiddenView.vue'), meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]
