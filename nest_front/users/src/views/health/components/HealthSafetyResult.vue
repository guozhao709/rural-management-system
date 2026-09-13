<script setup lang="ts">
import { computed } from 'vue'
import type { HealthAssessment } from '../types/health'

const props = defineProps<{ assessment: HealthAssessment }>()
const isEmergency = computed(() => props.assessment.triage.level === 'emergency')
const isUnavailable = computed(() => props.assessment.triage.level === 'insufficient')
</script>

<template>
  <section class="health-result" aria-label="健康评估结果">
    <div v-if="isEmergency" class="emergency-notice" role="alert">
      <strong>立即拨打 120 或前往急诊</strong>
      <span>请不要等待在线说明或自行处理。</span>
    </div>
    <div v-else-if="isUnavailable" class="unavailable-notice" role="status">
      <span>暂时无法评估。请补充必要信息；如症状明显加重或感到紧急，请及时寻求医疗帮助。</span>
      <template v-if="assessment.aiGenerated">
        <strong>AI 生成的补充说明</strong>
        <span>{{ assessment.result.summary }}</span>
        <ul v-if="assessment.result.nextActions.length" class="result-actions">
          <li v-for="action in assessment.result.nextActions" :key="action">{{ action }}</li>
        </ul>
        <span class="ai-label">此说明由 AI 生成，已通过安全校验。</span>
      </template>
    </div>
    <template v-if="!isUnavailable">
      <h2 class="result-title">健康评估</h2>
      <p class="result-summary">{{ assessment.result.summary }}</p>
      <p class="result-message">{{ assessment.triage.message }}</p>
      <ul v-if="assessment.result.nextActions.length" class="result-actions">
        <li v-for="action in assessment.result.nextActions" :key="action">{{ action }}</li>
      </ul>
      <p v-if="assessment.aiGenerated" class="ai-label">此说明由 AI 生成，已通过安全校验。</p>
      <p class="limitations">{{ assessment.result.limitations.join(' ') }}</p>
    </template>
  </section>
</template>

<style scoped>
.health-result { display: grid; gap: 12px; padding: 16px; border-radius: 16px; background: var(--color-bg-primary); }.emergency-notice, .unavailable-notice { display: grid; gap: 6px; padding: 16px; border-radius: 12px; line-height: 1.55; }.emergency-notice { color: var(--color-danger); background: #fff0ed; }.unavailable-notice { color: var(--color-text-primary); background: #fff4e8; }.result-title { margin: 0; font-size: 20px; }.result-summary, .result-message, .limitations { margin: 0; line-height: 1.6; }.result-message, .limitations, .ai-label { color: var(--color-text-secondary); font-size: 14px; }.result-actions { margin: 0; padding-left: 20px; line-height: 1.6; }
</style>
