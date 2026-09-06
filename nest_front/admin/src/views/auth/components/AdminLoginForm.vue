<script setup lang="ts">
import { reactive } from 'vue'
import type { AdminLoginInput } from '../../../app/auth'
defineProps<{ loading: boolean; errorMessage: string }>()
const emit = defineEmits<{ submit: [input: AdminLoginInput] }>()
const form = reactive<AdminLoginInput>({ username: '', password: '' })
function submit(): void { emit('submit', { username: form.username.trim(), password: form.password }) }
</script>
<template><el-form class="login-form" label-position="top" @submit.prevent="submit"><el-form-item label="用户名"><el-input v-model="form.username" autocomplete="username" /></el-form-item><el-form-item label="密码"><el-input v-model="form.password" type="password" show-password autocomplete="current-password" /></el-form-item><p v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</p><el-button native-type="submit" type="primary" :loading="loading">登录管理后台</el-button></el-form></template>
<style scoped>.login-form { display: grid; gap: 8px; }.login-form :deep(.el-form-item) { margin-bottom: 8px; }.login-error { margin: 0; color: var(--color-danger); font-size: 14px; }.login-form :deep(.el-button) { width: 100%; margin-top: 8px; }</style>
