<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'
import { buildMetricCreateInput, METRIC_UNITS } from '../utils/health-formatters'
import type { MetricCreateInput, MetricTemplate, MetricType } from '../types/health'

defineProps<{ templates: MetricTemplate[]; submitting: boolean }>()
const emit = defineEmits<{ submit: [input: MetricCreateInput] }>()
const form = reactive({ metricType: 'weight' as MetricType, value: '', systolic: '', diastolic: '', templateId: '', measuredAt: new Date().toISOString().slice(0, 16) })
const errorMessage = shallowRef('')
const unit = computed(() => form.metricType === 'blood_pressure' ? 'mmHg' : form.metricType === 'custom' ? '请选择模板' : METRIC_UNITS[form.metricType])

function submit(): void {
  errorMessage.value = ''
  try { emit('submit', buildMetricCreateInput(form)) } catch (error) { errorMessage.value = error instanceof Error ? error.message : '请检查输入。' }
}
</script>

<template>
  <section class="health-card" aria-labelledby="metric-form-title"><div class="section-heading"><div><p class="eyebrow">指标记录</p><h2 id="metric-form-title">记录一次测量</h2></div></div><form class="metric-form" @submit.prevent="submit"><label>指标类型<select v-model="form.metricType"><option value="weight">体重</option><option value="temperature">体温</option><option value="heart_rate">心率</option><option value="blood_pressure">血压</option><option value="custom">自定义指标</option></select></label><label v-if="form.metricType === 'custom'">跟踪模板<select v-model="form.templateId"><option value="">请选择模板</option><option v-for="template in templates" :key="template.id" :value="String(template.id)">{{ template.name }}（{{ template.unit }}）</option></select></label><label v-if="form.metricType === 'blood_pressure'">收缩压（mmHg）<input v-model="form.systolic" type="number" min="1" inputmode="decimal" /></label><label v-if="form.metricType === 'blood_pressure'">舒张压（mmHg）<input v-model="form.diastolic" type="number" min="1" inputmode="decimal" /></label><label v-else>数值（{{ unit }}）<input v-model="form.value" type="number" min="0" step="0.1" inputmode="decimal" /></label><label>测量时间<input v-model="form.measuredAt" type="datetime-local" /></label><p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p><van-button round block type="primary" native-type="submit" :loading="submitting">保存指标记录</van-button></form></section>
</template>

<style scoped>
.health-card { padding: 20px 16px; background: var(--color-bg-primary); border-radius: 16px; }.section-heading { margin-bottom: 14px; }.eyebrow { margin: 0 0 4px; color: var(--color-health); font-size: 14px; font-weight: 600; }.section-heading h2 { margin: 0; color: var(--color-text-primary); font-size: 20px; }.metric-form { display: grid; gap: 12px; }.metric-form label { display: grid; gap: 6px; color: var(--color-text-primary); font-size: 15px; }.metric-form input, .metric-form select { box-sizing: border-box; width: 100%; padding: 10px 11px; border: 1px solid var(--color-divider); border-radius: 10px; background: var(--color-bg-primary); color: var(--color-text-primary); font: inherit; }.metric-form input:focus, .metric-form select:focus { outline: 2px solid rgb(10 89 247 / 22%); border-color: var(--color-primary); }.error { margin: 0; color: var(--color-danger); line-height: 1.5; }
</style>
