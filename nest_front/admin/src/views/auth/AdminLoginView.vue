<script setup lang="ts">
import { shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAdminFacingError, type AdminLoginInput } from '../../app/auth'
import { useAuthStore } from '../../stores/auth'
import AdminLoginForm from './components/AdminLoginForm.vue'
const router = useRouter(); const route = useRoute(); const authStore = useAuthStore(); const loading = shallowRef(false); const errorMessage = shallowRef('')
async function login(input: AdminLoginInput): Promise<void> { loading.value = true; errorMessage.value = ''; try { await authStore.login(input); const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/dashboard'; await router.replace(redirect) } catch (error) { errorMessage.value = getAdminFacingError(error) } finally { loading.value = false } }
</script>
<template><main class="login-page"><section class="login-card"><p class="brand">智乡云 · 管理后台</p><h1>管理员登录</h1><p class="subtitle">使用管理员账号进入系统。</p><AdminLoginForm :loading="loading" :error-message="errorMessage" @submit="login" /></section></main></template>
<style scoped>.login-page { min-height: 100svh; display: grid; place-items: center; padding: 24px; box-sizing: border-box; background: var(--color-bg-secondary); }.login-card { width: min(100%, 420px); padding: 36px; border: 1px solid var(--color-border); border-radius: 10px; background: #fff; box-shadow: 0 8px 28px rgb(25 25 25 / 7%); }.brand { margin: 0 0 12px; color: var(--color-primary); font-weight: 600; }.login-card h1 { margin: 0 0 8px; color: var(--color-text-primary); font-size: 28px; }.subtitle { margin: 0 0 28px; color: var(--color-text-secondary); }</style>
