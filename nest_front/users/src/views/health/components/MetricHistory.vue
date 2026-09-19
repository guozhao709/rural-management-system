<script setup lang="ts">
import { formatDateTime, formatNumber, metricLabel } from '../utils/health-formatters'
import type { MetricRecord } from '../types/health'

const props = defineProps<{ records: MetricRecord[]; loading: boolean; total: number; page: number; pageSize: number; deletingId: number | null }>()
const emit = defineEmits<{ delete: [id: number]; pageChange: [page: number] }>()

function displayValue(record: MetricRecord): string { return record.metricType === 'blood_pressure' ? `${formatNumber(record.systolic)} / ${formatNumber(record.diastolic)} ${record.unit}` : `${formatNumber(record.value)} ${record.unit}` }
function askDelete(id: number): void { if (window.confirm('确定删除这条错误记录吗？删除后需要重新记录。')) emit('delete', id) }
</script>

<template><section class="health-card" aria-labelledby="metric-history-title"><div class="section-heading"><div><p class="eyebrow">历史记录</p><h2 id="metric-history-title">最近测量</h2></div><span class="count">共 {{ total }} 条</span></div><van-loading v-if="loading" class="inline-loading">正在加载记录…</van-loading><van-empty v-else-if="!records.length" image="search" description="暂无指标记录" /><div v-else class="record-list"><article v-for="record in props.records" :key="record.id" class="record-item"><div><strong>{{ metricLabel(record.metricType) }}</strong><p>{{ displayValue(record) }}</p><time>{{ formatDateTime(record.measuredAt) }}</time></div><button type="button" class="delete-button" :disabled="deletingId === record.id" @click="askDelete(record.id)">{{ deletingId === record.id ? '删除中…' : '删除' }}</button></article></div><div v-if="total > pageSize" class="pager"><van-button size="small" plain :disabled="page <= 1" @click="emit('pageChange', page - 1)">上一页</van-button><span>第 {{ page }} 页</span><van-button size="small" plain :disabled="page * pageSize >= total" @click="emit('pageChange', page + 1)">下一页</van-button></div></section></template>

<style scoped>
.health-card { padding: 20px 16px; background: var(--color-bg-primary); border-radius: 16px; }.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }.eyebrow { margin: 0 0 4px; color: var(--color-health); font-size: 14px; font-weight: 600; }.section-heading h2 { margin: 0; color: var(--color-text-primary); font-size: 20px; }.count { color: var(--color-text-tertiary); font-size: 14px; }.inline-loading { padding: 24px 0; text-align: center; }.record-list { margin-top: 12px; }.record-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 0; border-top: 1px solid var(--color-divider); }.record-item strong { color: var(--color-text-primary); }.record-item p, .record-item time { display: block; margin-top: 4px; color: var(--color-text-secondary); font-size: 14px; }.record-item time { color: var(--color-text-tertiary); font-size: 13px; }.delete-button { border: 0; padding: 7px 10px; border-radius: 999px; background: rgb(232 64 38 / 10%); color: var(--color-danger); }.delete-button:disabled { opacity: .6; }.pager { display: flex; align-items: center; justify-content: center; gap: 12px; padding-top: 12px; color: var(--color-text-secondary); font-size: 13px; }
</style>
