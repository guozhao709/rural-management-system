import type { Router } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
export function installPermissionGuard(router: Router): void { router.beforeEach(to => { const requiredRole = to.meta.requiredRole; if (!requiredRole) return true; const profile = useAuthStore().profile; if (profile?.role === requiredRole) return true; return { name: 'admin-forbidden' } }) }
