<script setup lang="ts">
import { shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { getUserFacingError } from '../../app/auth'
import { useAuthStore } from '../../stores/auth'

const router = useRouter(); const authStore = useAuthStore(); const errorMessage = shallowRef('')
async function logout(): Promise<void> { try { await authStore.logout() } catch (error) { errorMessage.value = getUserFacingError(error) } finally { await router.replace({ name: 'user-login' }) } }
</script>

<template><main class="home-page"><section class="home-card"><p class="brand">智乡云</p><h1>您好，{{ authStore.profile?.name }}</h1><p>农业服务已就绪，可查看种植知识并提交田间智能分析。</p><p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p><div class="actions"><van-button round type="primary" @click="router.push({ name: 'user-agriculture' })">进入农业服务</van-button><van-button round plain type="primary" @click="logout">退出登录</van-button></div></section></main></template>

<style scoped>
.home-page { min-height: 100svh; padding: 24px; box-sizing: border-box; background: var(--color-bg-secondary); }.home-card { margin: 12vh auto; width: min(100%, 520px); padding: 28px; border-radius: 20px; background: var(--color-bg-primary); }.brand { color: var(--color-primary); font-weight: 700; }.home-card h1 { color: var(--color-text-primary); }.home-card p { color: var(--color-text-secondary); line-height: 1.6; }.error { color: var(--color-danger) !important; }.actions { display: grid; gap: 12px; margin-top: 24px; }
</style>
