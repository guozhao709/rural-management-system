<script setup lang="ts">
import { reactive, shallowRef } from 'vue'
import { formatDateTime, metricLabel } from '../utils/health-formatters'
import type { MetricTemplate, MetricTemplateInput } from '../types/health'

const props = defineProps<{ templates: MetricTemplate[]; loading: boolean; saving: boolean }>()
const emit = defineEmits<{ create: [input: MetricTemplateInput]; end: [id: number] }>()
const form = reactive<MetricTemplateInput>({ name: '', metricName: '', unit: '', relatedSystemMetricType: null, startedAt: new Date().toISOString().slice(0, 16) })
const errorMessage = shallowRef('')

function submit(): void {
  errorMessage.value = ''
  if (!form.name.trim() || !form.metricName.trim() || !form.unit.trim() || !form.startedAt) { errorMessage.value = '请完整填写模板名称、指标名称、单位和开始时间。'; return }
  emit('create', { ...form, name: form.name.trim(), metricName: form.metricName.trim(), unit: form.unit.trim(), startedAt: new Date(form.startedAt).toISOString() })
}

function finish(template: MetricTemplate): void { if (window.confirm(`结束“${template.name}”的跟踪吗？历史记录仍会保留。`)) emit('end', template.id) }
</script>

<template><section class="health-card" aria-labelledby="template-title"><div class="section-heading"><div><p class="eyebrow">自定义跟踪</p><h2 id="template-title">指标模板</h2></div></div><form class="template-form" @submit.prevent="submit"><input v-model="form.name" aria-label="模板名称" placeholder="模板名称，如发烧期间体温" /><input v-model="form.metricName" aria-label="指标名称" placeholder="指标名称，如体温" /><input v-model="form.unit" aria-label="单位" placeholder="单位，如 ℃" /><select v-model="form.relatedSystemMetricType" aria-label="关联系统指标"><option :value="null">不关联系统指标</option><option value="temperature">关联体温</option><option value="weight">关联体重</option><option value="heart_rate">关联心率</option><option value="blood_pressure">关联血压</option></select><label>开始时间<input v-model="form.startedAt" type="datetime-local" /></label><p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p><van-button round block type="primary" native-type="submit" :loading="saving">创建跟踪模板</van-button></form><van-loading v-if="loading" class="inline-loading">正在加载模板…</van-loading><van-empty v-else-if="!props.templates.length" image="search" description="暂无自定义模板" /><div v-else class="template-list"><article v-for="template in props.templates" :key="template.id" class="template-item"><div><strong>{{ template.name }}</strong><p>{{ template.metricName }} · {{ template.unit }}<span v-if="template.relatedSystemMetricType"> · {{ metricLabel(template.relatedSystemMetricType) }}</span></p><time>{{ template.endedAt ? `已结束：${formatDateTime(template.endedAt)}` : `开始于：${formatDateTime(template.startedAt)}` }}</time></div><button v-if="!template.endedAt" type="button" class="finish-button" @click="finish(template)">结束跟踪</button></article></div></section></template>

<style scoped>
.health-card { padding: 20px 16px; background: var(--color-bg-primary); border-radius: 16px; }.section-heading { margin-bottom: 14px; }.eyebrow { margin: 0 0 4px; color: var(--color-health); font-size: 14px; font-weight: 600; }.section-heading h2 { margin: 0; color: var(--color-text-primary); font-size: 20px; }.template-form { display: grid; gap: 10px; }.template-form input, .template-form select { box-sizing: border-box; width: 100%; padding: 10px 11px; border: 1px solid var(--color-divider); border-radius: 10px; background: var(--color-bg-primary); color: var(--color-text-primary); font: inherit; }.template-form label { display: grid; gap: 6px; color: var(--color-text-primary); font-size: 15px; }.error { margin: 0; color: var(--color-danger); }.inline-loading { padding: 18px 0; text-align: center; }.template-list { margin-top: 16px; }.template-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-top: 1px solid var(--color-divider); }.template-item strong { color: var(--color-text-primary); }.template-item p, .template-item time { display: block; margin-top: 4px; color: var(--color-text-secondary); font-size: 13px; }.template-item time { color: var(--color-text-tertiary); }.finish-button { flex: none; border: 1px solid var(--color-divider); padding: 7px 10px; border-radius: 999px; background: var(--color-bg-primary); color: var(--color-text-secondary); }
</style>
