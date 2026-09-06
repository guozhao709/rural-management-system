import type { Router } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

export function installAuthGuard(router: Router): void {
  router.beforeEach(async to => {
    const authStore = useAuthStore()
    if (to.meta.requiresAuth) {
      await authStore.restore()
    }
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return { name: 'user-login', query: { redirect: to.fullPath } }
    }
    if (to.meta.guestOnly && authStore.isAuthenticated) {
      return { name: 'user-home' }
    }
    return true
  })
}
