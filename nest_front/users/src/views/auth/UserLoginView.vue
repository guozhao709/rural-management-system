<script setup lang="ts">
import { shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUserFacingError, type UserLoginInput } from '../../app/auth'
import { useAuthStore } from '../../stores/auth'
import UserLoginForm from './components/UserLoginForm.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const loading = shallowRef(false)
const errorMessage = shallowRef('')

async function login(input: UserLoginInput): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    await authStore.login(input)
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/home'
    await router.replace(redirect)
  } catch (error) {
    errorMessage.value = getUserFacingError(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-page"><section class="auth-card"><p class="brand">智乡云</p><h1>欢迎回来</h1><p class="subtitle">登录后查看您的乡村生活服务。</p><UserLoginForm :loading="loading" :error-message="errorMessage" @submit="login" /><RouterLink class="auth-link" :to="{ name: 'user-register' }">还没有账号？去注册</RouterLink></section></main>
</template>

<style scoped>
.auth-page { min-height: 100svh; display: grid; place-items: center; padding: 24px; box-sizing: border-box; background: var(--color-bg-secondary); }
.auth-card { width: min(100%, 420px); padding: 32px 8px 24px; border-radius: 24px; background: var(--color-bg-primary); box-shadow: 0 8px 24px rgb(25 25 25 / 8%); }
.brand { margin: 0 24px 8px; color: var(--color-primary); font-weight: 700; font-size: 18px; }.auth-card h1 { margin: 0 24px 8px; color: var(--color-text-primary); font-size: 28px; }.subtitle { margin: 0 24px 24px; color: var(--color-text-secondary); font-size: 15px; }.auth-link { display: block; margin-top: 20px; text-align: center; color: var(--color-primary); font-size: 15px; }
</style>
