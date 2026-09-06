<script setup lang="ts">
import { shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { getUserFacingError, type UserRegistrationInput } from '../../app/auth'
import { useAuthStore } from '../../stores/auth'
import UserRegisterForm from './components/UserRegisterForm.vue'

const router = useRouter()
const authStore = useAuthStore()
const loading = shallowRef(false)
const errorMessage = shallowRef('')

async function register(input: UserRegistrationInput): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try { await authStore.register(input); await router.replace({ name: 'user-home' }) } catch (error) { errorMessage.value = getUserFacingError(error) } finally { loading.value = false }
}
</script>

<template><main class="auth-page"><section class="auth-card"><p class="brand">智乡云</p><h1>创建账号</h1><p class="subtitle">填写基本信息，开启智乡云服务。</p><UserRegisterForm :loading="loading" :error-message="errorMessage" @submit="register" /><RouterLink class="auth-link" :to="{ name: 'user-login' }">已有账号？去登录</RouterLink></section></main></template>

<style scoped>
.auth-page { min-height: 100svh; display: grid; place-items: center; padding: 24px; box-sizing: border-box; background: var(--color-bg-secondary); }.auth-card { width: min(100%, 420px); padding: 32px 8px 24px; border-radius: 24px; background: var(--color-bg-primary); box-shadow: 0 8px 24px rgb(25 25 25 / 8%); }.brand { margin: 0 24px 8px; color: var(--color-primary); font-weight: 700; font-size: 18px; }.auth-card h1 { margin: 0 24px 8px; color: var(--color-text-primary); font-size: 28px; }.subtitle { margin: 0 24px 24px; color: var(--color-text-secondary); font-size: 15px; }.auth-link { display: block; margin-top: 20px; text-align: center; color: var(--color-primary); font-size: 15px; }
</style>
