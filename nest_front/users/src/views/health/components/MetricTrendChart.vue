<script setup lang="ts">
import { computed } from 'vue'
import { formatNumber, formatTrend } from '../utils/health-formatters'
import type { BloodPressureTrend, MetricTrend, SingleValueTrend } from '../types/health'

const props = defineProps<{ trend: MetricTrend | null; loading: boolean }>()
const isBloodPressure = computed(() => props.trend?.target.type === 'blood_pressure')
const singleStatistics = computed(() => isBloodPressure.value ? null : (props.trend as SingleValueTrend | null)?.statistics ?? null)
const bloodStatistics = computed(() => isBloodPressure.value ? (props.trend as BloodPressureTrend).statistics : null)
const chartPoints = computed(() => {
  if (!props.trend || !props.trend.points.length) return { min: 0, max: 1, single: '', systolic: '', diastolic: '' }
  if (props.trend.target.type === 'blood_pressure') {
    const points = (props.trend as BloodPressureTrend).points
    const values = points.flatMap(point => [point.systolic, point.diastolic])
    const min = Math.min(...values); const max = Math.max(...values); const span = max - min || 1
    const point = (value: number, index: number) => `${(index / Math.max(points.length - 1, 1)) * 100},${92 - ((value - min) / span) * 78}`
    return { min, max, single: '', systolic: points.map((item, index) => point(item.systolic, index)).join(' '), diastolic: points.map((item, index) => point(item.diastolic, index)).join(' ') }
  }
  const points = (props.trend as SingleValueTrend).points
  const values = points.map(point => point.value)
  const min = Math.min(...values); const max = Math.max(...values); const span = max - min || 1
  const point = (value: number, index: number) => `${(index / Math.max(points.length - 1, 1)) * 100},${92 - ((value - min) / span) * 78}`
  return { min, max, single: points.map((item, index) => point(item.value, index)).join(' '), systolic: '', diastolic: '' }
})
</script>

<template><section class="health-card" aria-labelledby="trend-title"><div class="section-heading"><div><p class="eyebrow">趋势观察</p><h2 id="trend-title">指标变化</h2></div><span v-if="trend" class="unit">{{ trend.target.unit }}</span></div><van-loading v-if="loading" class="inline-loading">正在加载趋势…</van-loading><van-empty v-else-if="!trend || !trend.points.length" image="search" description="选择指标后查看趋势" /><template v-else><div class="chart-wrap"><svg viewBox="0 0 100 100" role="img" aria-label="健康指标趋势图" preserveAspectRatio="none"><line x1="0" y1="92" x2="100" y2="92" stroke="var(--color-divider)" stroke-width=".6" /><polyline v-if="!isBloodPressure" :points="chartPoints.single" fill="none" stroke="var(--color-health)" stroke-width="2" vector-effect="non-scaling-stroke" /><polyline v-if="isBloodPressure" :points="chartPoints.systolic" fill="none" stroke="var(--color-primary)" stroke-width="2" vector-effect="non-scaling-stroke" /><polyline v-if="isBloodPressure" :points="chartPoints.diastolic" fill="none" stroke="var(--color-health)" stroke-width="2" vector-effect="non-scaling-stroke" /></svg></div><div class="legend"><span><i class="dot single-dot" />{{ isBloodPressure ? '收缩压' : '指标值' }}</span><span v-if="isBloodPressure"><i class="dot diastolic-dot" />舒张压</span></div><div v-if="singleStatistics" class="stats"><span>最新 {{ formatNumber(singleStatistics.latest) }}</span><span>变化 {{ formatNumber(singleStatistics.change) }}</span><span>{{ formatTrend(singleStatistics.trend) }}</span></div><div v-else-if="bloodStatistics" class="stats"><span>收缩压 {{ formatNumber(bloodStatistics.systolic.latest) }}</span><span>舒张压 {{ formatNumber(bloodStatistics.diastolic.latest) }}</span><span>共 {{ trend.points.length }} 次</span></div></template></section></template>

<style scoped>
.health-card { padding: 20px 16px; background: var(--color-bg-primary); border-radius: 16px; }.section-heading { display: flex; align-items: center; justify-content: space-between; }.eyebrow { margin: 0 0 4px; color: var(--color-health); font-size: 14px; font-weight: 600; }.section-heading h2 { margin: 0; color: var(--color-text-primary); font-size: 20px; }.unit { color: var(--color-text-secondary); font-size: 14px; }.inline-loading { padding: 24px 0; text-align: center; }.chart-wrap { height: 170px; margin-top: 16px; padding: 10px 0; background: linear-gradient(to bottom, transparent 24%, var(--color-divider) 25%, transparent 26%, transparent 49%, var(--color-divider) 50%, transparent 51%, transparent 74%, var(--color-divider) 75%, transparent 76%); }.chart-wrap svg { width: 100%; height: 100%; overflow: visible; }.legend, .stats { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; color: var(--color-text-secondary); font-size: 13px; }.dot { display: inline-block; width: 8px; height: 8px; margin-right: 4px; border-radius: 50%; background: var(--color-health); }.single-dot { background: var(--color-primary); }.stats { justify-content: space-between; color: var(--color-text-primary); font-size: 14px; font-weight: 600; }
</style>
