<script setup lang="ts">
import { shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { getAdminFacingError } from '../../app/auth'
import { useAuthStore } from '../../stores/auth'
const router = useRouter(); const authStore = useAuthStore(); const errorMessage = shallowRef('')
async function logout(): Promise<void> { try { await authStore.logout() } catch (error) { errorMessage.value = getAdminFacingError(error) } finally { await router.replace({ name: 'admin-login' }) } }
</script>
<template><main class="dashboard-page"><section class="dashboard-card"><p class="brand">智乡云 · 管理后台</p><h1>您好，{{ authStore.profile?.username }}</h1><el-tag type="primary">{{ authStore.profile?.role === 'super_admin' ? '超级管理员' : '管理员' }}</el-tag><p class="description">农业作物目录与知识内容可在农业管理中维护。</p><el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon /><div class="actions"><el-button type="primary" @click="router.push({ name: 'admin-agriculture' })">农业管理</el-button><el-button v-if="authStore.profile?.role === 'super_admin'" @click="router.push({ name: 'admin-management' })">管理员权限页</el-button><el-button @click="logout">退出登录</el-button></div></section></main></template>
<style scoped>.dashboard-page { min-height: 100svh; padding: 48px; box-sizing: border-box; background: var(--color-bg-secondary); }.dashboard-card { max-width: 720px; padding: 32px; border: 1px solid var(--color-border); border-radius: 10px; background: #fff; }.brand { color: var(--color-primary); font-weight: 600; }.dashboard-card h1 { color: var(--color-text-primary); }.description { color: var(--color-text-secondary); }.actions { display: flex; gap: 12px; margin-top: 24px; }</style>
