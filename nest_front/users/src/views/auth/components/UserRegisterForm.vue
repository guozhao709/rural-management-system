<script setup lang="ts">
import { reactive } from 'vue'
import type { UserGender, UserRegistrationInput } from '../../../app/auth'

defineProps<{ loading: boolean; errorMessage: string }>()
const emit = defineEmits<{ submit: [input: UserRegistrationInput] }>()
const form = reactive<{ phone: string; password: string; name: string; gender: UserGender; birthday: string; address: string }>({ phone: '', password: '', name: '', gender: 'unknown', birthday: '', address: '' })

function submit(): void {
  emit('submit', { ...form, phone: form.phone.trim(), name: form.name.trim(), birthday: form.birthday || null, address: form.address.trim() || null })
}
</script>

<template>
  <van-form class="auth-form" @submit="submit">
    <van-cell-group inset>
      <van-field v-model="form.name" name="name" label="姓名" autocomplete="name" :rules="[{ required: true, message: '请输入姓名' }]" />
      <van-field v-model="form.phone" name="phone" label="手机号" inputmode="tel" autocomplete="tel" :rules="[{ required: true, message: '请输入手机号' }]" />
      <van-field v-model="form.password" name="password" label="密码" type="password" autocomplete="new-password" :rules="[{ required: true, message: '请输入密码' }, { validator: (value: string) => value.length >= 8, message: '密码至少 8 个字符' }]" />
      <van-field v-model="form.gender" is-link readonly name="gender" label="性别" @click="form.gender = form.gender === 'male' ? 'female' : form.gender === 'female' ? 'unknown' : 'male'" />
      <van-field v-model="form.birthday" name="birthday" label="出生日期" type="date" />
      <van-field v-model="form.address" name="address" label="地址" autocomplete="street-address" />
    </van-cell-group>
    <p v-if="errorMessage" class="auth-error" role="alert">{{ errorMessage }}</p>
    <div class="auth-actions"><van-button block round type="primary" native-type="submit" :loading="loading">注册并登录</van-button></div>
  </van-form>
</template>

<style scoped>
.auth-form { display: grid; gap: 16px; }
.auth-error { margin: 0; color: var(--color-danger); font-size: 14px; }
.auth-actions { padding: 0 16px; }
</style>
