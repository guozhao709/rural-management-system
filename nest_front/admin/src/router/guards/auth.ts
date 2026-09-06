import type { Router } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
export function installAuthGuard(router: Router): void { router.beforeEach(async to => { const authStore = useAuthStore(); if (to.meta.requiresAuth) { await authStore.restore(); if (!authStore.isAuthenticated) return { name: 'admin-login', query: { redirect: to.fullPath } } }; if (to.meta.guestOnly && authStore.isAuthenticated) return { name: 'admin-dashboard' }; return true }) }
