<script setup lang="ts">
import { computed } from 'vue'
import type { AgricultureAnalysis } from '../types/agriculture'
const props = defineProps<{ analysis: AgricultureAnalysis | null }>()
const levelLabel = computed(() => ({ low: '谨慎种植', medium: '适宜性一般', high: '适宜种植' })[props.analysis?.result?.suitability.level ?? 'medium'])
</script>

<template>
  <section v-if="analysis" class="outcome" aria-live="polite">
    <template v-if="analysis.status === 'succeeded' && analysis.result">
      <van-notice-bar v-for="warning in analysis.result.contextWarnings" :key="warning" wrapable left-icon="warning-o" color="#8a5a00" background="#fff7e6">{{ warning }}</van-notice-bar>
      <article class="overview-card"><p class="eyebrow">{{ analysis.cropName }} · {{ analysis.regionName }}</p><h2>{{ levelLabel }}（{{ analysis.result.suitability.score }} 分）</h2><p>{{ analysis.result.overview }}</p></article>
      <van-cell-group inset title="判断依据"><van-cell v-for="reason in analysis.result.suitability.reasons" :key="reason" :title="reason" /></van-cell-group>
      <van-cell-group v-if="analysis.result.risks.length" inset title="风险提示"><van-cell v-for="risk in analysis.result.risks" :key="risk.description" :title="risk.description" :label="risk.evidence.join('；')"><template #value><van-tag :type="risk.level === 'high' ? 'danger' : risk.level === 'medium' ? 'warning' : 'primary'">{{ risk.level === 'high' ? '高' : risk.level === 'medium' ? '中' : '低' }}风险</van-tag></template></van-cell></van-cell-group>
      <van-cell-group v-if="analysis.result.actions.length" inset title="建议行动"><van-cell v-for="action in analysis.result.actions" :key="action.action" :title="action.action" :label="`${action.timing} · ${action.rationale}`"><template #value><van-tag :type="action.priority === 'high' ? 'danger' : action.priority === 'medium' ? 'warning' : 'primary'">{{ action.priority === 'high' ? '优先' : action.priority === 'medium' ? '建议' : '可选' }}</van-tag></template></van-cell></van-cell-group>
      <p class="disclaimer">{{ analysis.result.disclaimer }}</p>
    </template>
    <van-empty v-else image="error" description="本次分析未能生成结果，请稍后重试。" />
  </section>
</template>

<style scoped>
.outcome { padding: 8px 0 24px; }.overview-card { margin: 16px; padding: 20px; border-radius: 16px; background: #eaf1ff; }.overview-card h2 { margin: 8px 0; font-size: 22px; }.overview-card p { color: var(--color-text-secondary); line-height: 1.7; }.eyebrow { color: var(--color-primary) !important; font-size: 14px; font-weight: 600; }.disclaimer { padding: 16px; color: var(--color-text-secondary); font-size: 13px; line-height: 1.6; }
</style>
