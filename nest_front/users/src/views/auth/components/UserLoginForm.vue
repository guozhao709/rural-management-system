<script setup lang="ts">
import { reactive } from 'vue'
import type { UserLoginInput } from '../../../app/auth'

defineProps<{ loading: boolean; errorMessage: string }>()

const emit = defineEmits<{ submit: [input: UserLoginInput] }>()
const form = reactive<UserLoginInput>({ phone: '', password: '' })

function submit(): void {
  emit('submit', { phone: form.phone.trim(), password: form.password })
}
</script>

<template>
  <van-form class="auth-form" @submit="submit">
    <van-cell-group inset>
      <van-field v-model="form.phone" name="phone" label="手机号" inputmode="tel" autocomplete="tel" :rules="[{ required: true, message: '请输入手机号' }]" />
      <van-field v-model="form.password" name="password" label="密码" type="password" autocomplete="current-password" :rules="[{ required: true, message: '请输入密码' }]" />
    </van-cell-group>
    <p v-if="errorMessage" class="auth-error" role="alert">{{ errorMessage }}</p>
    <div class="auth-actions"><van-button block round type="primary" native-type="submit" :loading="loading">登录</van-button></div>
  </van-form>
</template>

<style scoped>
.auth-form { display: grid; gap: 16px; }
.auth-error { margin: 0; color: var(--color-danger); font-size: 14px; }
.auth-actions { padding: 0 16px; }
</style>
