import { computed, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import {
  userAuthApi,
  type UserLoginInput,
  type UserProfile,
  type UserRegistrationInput,
  type UserSession,
} from '../app/auth'

export const useAuthStore = defineStore('user-auth', () => {
  const accessToken = shallowRef<string | null>(null)
  const profile = shallowRef<UserProfile | null>(null)
  const isRestored = shallowRef(false)
  let restoreTask: Promise<boolean> | undefined
  const isAuthenticated = computed(() => accessToken.value !== null && profile.value !== null)

  function applySession(session: UserSession): void {
    accessToken.value = session.accessToken
    profile.value = session.user
  }

  function clearSession(): void {
    accessToken.value = null
    profile.value = null
  }

  async function login(input: UserLoginInput): Promise<void> {
    applySession(await userAuthApi.login(input))
    isRestored.value = true
  }

  async function register(input: UserRegistrationInput): Promise<void> {
    applySession(await userAuthApi.register(input))
    isRestored.value = true
  }

  async function refresh(): Promise<boolean> {
    try {
      applySession(await userAuthApi.refresh())
      return true
    } catch {
      clearSession()
      return false
    }
  }

  async function restore(): Promise<boolean> {
    if (isRestored.value) return isAuthenticated.value
    restoreTask ??= refresh().finally(() => {
      isRestored.value = true
      restoreTask = undefined
    })
    return restoreTask
  }

  async function logout(): Promise<void> {
    try {
      await userAuthApi.logout()
    } finally {
      clearSession()
      isRestored.value = true
    }
  }

  return { accessToken, profile, isRestored, isAuthenticated, login, register, refresh, restore, logout, clearSession }
})
