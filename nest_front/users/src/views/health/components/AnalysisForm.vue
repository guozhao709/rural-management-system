<script setup lang="ts">
import { reactive, shallowRef } from 'vue'
import type { AnalysisDuration, AnalysisInput, Severity } from '../types/health'

defineProps<{ submitting: boolean; errorMessage: string }>()
const emit = defineEmits<{ submit: [input: AnalysisInput] }>()
const symptoms = [{ value: 'dizziness', label: '头晕' }, { value: 'headache', label: '头痛' }, { value: 'fatigue', label: '乏力' }, { value: 'fever', label: '发热' }, { value: 'chills', label: '怕冷' }, { value: 'cough', label: '咳嗽' }, { value: 'sore_throat', label: '咽痛' }, { value: 'breathing_discomfort', label: '呼吸不适' }, { value: 'chest_tightness', label: '胸闷' }, { value: 'palpitations', label: '心慌' }, { value: 'nausea', label: '恶心' }, { value: 'abdominal_pain', label: '腹痛' }, { value: 'diarrhea', label: '腹泻' }, { value: 'poor_appetite', label: '食欲不振' }, { value: 'insomnia', label: '失眠' }, { value: 'drowsiness', label: '嗜睡' }, { value: 'other', label: '其他' }]
const form = reactive<{ symptoms: string[]; severity: Severity; duration: AnalysisDuration; description: string }>({ symptoms: [], severity: 'mild', duration: 'today', description: '' })
const localError = shallowRef('')

function submit(): void {
  localError.value = ''
  if (!form.symptoms.length && !form.description.trim()) { localError.value = '请选择至少一个症状，或补充本次情况。'; return }
  const description = form.description.trim()
  emit('submit', { symptoms: [...form.symptoms], severity: form.severity, duration: form.duration, ...(description ? { description } : {}) })
}
</script>

<template><section class="health-card" aria-labelledby="analysis-title"><div class="section-heading"><div><p class="eyebrow">AI 健康分析</p><h2 id="analysis-title">这一次发生了什么？</h2></div></div><p class="helper">只填写本次情况，已有档案和指标由系统按当前账号自动带入。结果仅供健康信息参考，不是诊断。</p><form class="analysis-form" @submit.prevent="submit"><fieldset><legend>症状（可多选）</legend><div class="symptoms"><label v-for="symptom in symptoms" :key="symptom.value" class="symptom-option"><input v-model="form.symptoms" type="checkbox" :value="symptom.value" />{{ symptom.label }}</label></div></fieldset><label>严重程度<select v-model="form.severity"><option value="mild">轻微</option><option value="moderate">一般</option><option value="severe">严重</option></select></label><label>持续时间<select v-model="form.duration"><option value="today">今天刚出现</option><option value="1_3_days">1～3 天</option><option value="4_7_days">4～7 天</option><option value="over_a_week">一周以上</option><option value="recurring">反复出现</option></select></label><label>补充描述<textarea v-model="form.description" rows="4" placeholder="例如：昨晚睡得较晚，今天下午开始头晕。" /></label><p v-if="localError || errorMessage" class="error" role="alert">{{ localError || errorMessage }}</p><van-button round block type="primary" native-type="submit" :loading="submitting" :disabled="submitting">生成健康分析</van-button></form></section></template>

<style scoped>
.health-card { padding: 20px 16px; background: var(--color-bg-primary); border-radius: 16px; }.section-heading { margin-bottom: 8px; }.eyebrow { margin: 0 0 4px; color: var(--color-health); font-size: 14px; font-weight: 600; }.section-heading h2 { margin: 0; color: var(--color-text-primary); font-size: 20px; }.helper { margin: 0 0 16px; color: var(--color-text-secondary); font-size: 15px; line-height: 1.6; }.analysis-form { display: grid; gap: 14px; }.analysis-form fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }.analysis-form legend, .analysis-form label { color: var(--color-text-primary); font-size: 15px; }.symptoms { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }.symptom-option { display: inline-flex; align-items: center; gap: 5px; padding: 8px 10px; border-radius: 999px; background: var(--color-bg-secondary); }.analysis-form > label { display: grid; gap: 6px; }.analysis-form select, .analysis-form textarea { box-sizing: border-box; width: 100%; padding: 10px 11px; border: 1px solid var(--color-divider); border-radius: 10px; background: var(--color-bg-primary); color: var(--color-text-primary); font: inherit; }.error { margin: 0; color: var(--color-danger); line-height: 1.5; }
</style>
