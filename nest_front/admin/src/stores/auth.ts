import { computed, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { adminAuthApi, type AdminLoginInput, type AdminProfile, type AdminSession } from '../app/auth'
export const useAuthStore = defineStore('admin-auth', () => {
  const accessToken = shallowRef<string | null>(null); const profile = shallowRef<AdminProfile | null>(null); const isRestored = shallowRef(false); let restoreTask: Promise<boolean> | undefined
  const isAuthenticated = computed(() => accessToken.value !== null && profile.value !== null)
  function applySession(session: AdminSession): void { accessToken.value = session.accessToken; profile.value = session.admin }
  function clearSession(): void { accessToken.value = null; profile.value = null }
  async function login(input: AdminLoginInput): Promise<void> { applySession(await adminAuthApi.login(input)); isRestored.value = true }
  async function refresh(): Promise<boolean> { try { applySession(await adminAuthApi.refresh()); return true } catch { clearSession(); return false } }
  async function restore(): Promise<boolean> { if (isRestored.value) return isAuthenticated.value; restoreTask ??= refresh().finally(() => { isRestored.value = true; restoreTask = undefined }); return restoreTask }
  async function logout(): Promise<void> { try { await adminAuthApi.logout() } finally { clearSession(); isRestored.value = true } }
  return { accessToken, profile, isRestored, isAuthenticated, login, refresh, restore, logout, clearSession }
})
