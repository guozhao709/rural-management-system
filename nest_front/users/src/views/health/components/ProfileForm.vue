<script setup lang="ts">
import { reactive, shallowRef, watch } from 'vue'
import type { HealthProfile, HealthProfileInput } from '../types/health'

const props = defineProps<{ profile: HealthProfile | null; loading: boolean; saving: boolean; errorMessage: string }>()
const emit = defineEmits<{ save: [input: HealthProfileInput] }>()
const form = reactive<HealthProfileInput>({ sex: null, birthDate: null, heightCm: null, smokingStatus: null, drinkingStatus: null, exerciseStatus: null, sleepStatus: null, healthHistory: null, allergies: null })
const localError = shallowRef('')

watch(() => props.profile, value => Object.assign(form, value ? { sex: value.sex, birthDate: value.birthDate, heightCm: value.heightCm, smokingStatus: value.smokingStatus, drinkingStatus: value.drinkingStatus, exerciseStatus: value.exerciseStatus, sleepStatus: value.sleepStatus, healthHistory: value.healthHistory, allergies: value.allergies } : { sex: null, birthDate: null, heightCm: null, smokingStatus: null, drinkingStatus: null, exerciseStatus: null, sleepStatus: null, healthHistory: null, allergies: null }), { immediate: true })

function submit(): void {
  localError.value = ''
  if (form.heightCm !== null && (!Number.isFinite(Number(form.heightCm)) || Number(form.heightCm) <= 0)) { localError.value = '身高必须是大于 0 的数值。'; return }
  emit('save', { ...form, heightCm: form.heightCm === null ? null : Number(form.heightCm), birthDate: form.birthDate || null })
}
</script>

<template>
  <section class="health-card profile-card" aria-labelledby="profile-title">
    <div class="section-heading"><div><p class="eyebrow">健康档案</p><h2 id="profile-title">记录稳定的健康背景</h2></div><span class="status-pill">{{ profile ? '已建档' : '待建档' }}</span></div>
    <p class="helper">可以暂时留空，缺失信息会按“未知”处理，不影响后续健康分析。</p>
    <van-loading v-if="loading" class="inline-loading">正在加载档案…</van-loading>
    <form v-else class="profile-form" @submit.prevent="submit">
      <label>性别<select v-model="form.sex"><option :value="null">未填写</option><option value="male">男</option><option value="female">女</option></select></label>
      <label>出生日期<input v-model="form.birthDate" type="date" /></label>
      <label>身高（cm）<input v-model="form.heightCm" inputmode="decimal" type="number" min="0" step="0.1" placeholder="未填写" /></label>
      <label>吸烟情况<select v-model="form.smokingStatus"><option :value="null">未填写</option><option value="never">从不</option><option value="occasional">偶尔</option><option value="current">目前吸烟</option></select></label>
      <label>饮酒情况<select v-model="form.drinkingStatus"><option :value="null">未填写</option><option value="never">从不</option><option value="occasional">偶尔</option><option value="often">经常</option></select></label>
      <label>运动情况<select v-model="form.exerciseStatus"><option :value="null">未填写</option><option value="low">较少</option><option value="moderate">适中</option><option value="often">经常</option></select></label>
      <label>睡眠情况<select v-model="form.sleepStatus"><option :value="null">未填写</option><option value="poor">较差</option><option value="average">一般</option><option value="good">良好</option></select></label>
      <label class="wide">既往健康情况<textarea v-model="form.healthHistory" rows="2" placeholder="没有需要补充的内容可留空" /></label>
      <label class="wide">过敏情况<textarea v-model="form.allergies" rows="2" placeholder="没有已知过敏可留空" /></label>
      <p v-if="localError || errorMessage" class="error wide" role="alert">{{ localError || errorMessage }}</p>
      <div class="form-actions wide"><van-button round block type="primary" native-type="submit" :loading="saving">保存健康档案</van-button></div>
    </form>
  </section>
</template>

<style scoped>
.health-card { padding: 20px 16px; background: var(--color-bg-primary); border-radius: 16px; }.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }.eyebrow { margin: 0 0 4px; color: var(--color-health); font-size: 14px; font-weight: 600; }.section-heading h2 { margin: 0; color: var(--color-text-primary); font-size: 20px; }.helper { margin: 10px 0 16px; color: var(--color-text-secondary); font-size: 15px; line-height: 1.6; }.status-pill { flex: none; padding: 4px 9px; border-radius: 999px; background: var(--color-health-soft); color: var(--color-health); font-size: 13px; }.inline-loading { padding: 24px 0; text-align: center; }.profile-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }.profile-form label { display: grid; gap: 6px; color: var(--color-text-primary); font-size: 15px; }.profile-form input, .profile-form select, .profile-form textarea { width: 100%; box-sizing: border-box; padding: 10px 11px; border: 1px solid var(--color-divider); border-radius: 10px; color: var(--color-text-primary); background: var(--color-bg-primary); font: inherit; }.profile-form input:focus, .profile-form select:focus, .profile-form textarea:focus { outline: 2px solid rgb(10 89 247 / 22%); border-color: var(--color-primary); }.wide { grid-column: 1 / -1; }.error { margin: 0; color: var(--color-danger); line-height: 1.5; }.form-actions { padding-top: 4px; }@media (max-width: 560px) { .profile-form { grid-template-columns: 1fr; }.wide { grid-column: auto; } }
</style>
