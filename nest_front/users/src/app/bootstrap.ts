import type { Pinia } from 'pinia'
import type { Router } from 'vue-router'
import { configureRequestAuth } from '../api/request'
import { useAuthStore } from '../stores/auth'

export function configureAuthentication(pinia: Pinia, router: Router): void {
  configureRequestAuth({
    getAccessToken: () => useAuthStore(pinia).accessToken,
    refresh: () => useAuthStore(pinia).refresh(),
    onUnauthenticated: () => {
      void router.replace({ name: 'user-login' })
    },
  })
}
