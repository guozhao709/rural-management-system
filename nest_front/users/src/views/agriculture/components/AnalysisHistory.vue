<script setup lang="ts">
import type { AgricultureAnalysis } from '../types/agriculture'
defineProps<{ items: AgricultureAnalysis[]; loading: boolean }>()
const emit = defineEmits<{ select: [analysis: AgricultureAnalysis] }>()
</script>
<template><section class="history"><h2 class="history-title">近期分析</h2><van-loading v-if="loading" class="history-loading">加载中…</van-loading><van-empty v-else-if="!items.length" image="search" description="暂无历史分析" /><van-cell-group v-else inset><van-cell v-for="item in items" :key="item.id" is-link :title="`${item.cropName} · ${item.regionName}`" :label="item.createdAt" @click="emit('select', item)"><template #value><van-tag :type="item.status === 'succeeded' ? 'success' : item.status === 'failed' ? 'danger' : 'warning'">{{ item.status === 'succeeded' ? '已完成' : item.status === 'failed' ? '失败' : '处理中' }}</van-tag></template></van-cell></van-cell-group></section></template>
<style scoped>.history { padding: 24px 0; }.history-title { margin: 0; padding: 0 16px 12px; font-size: 20px; }.history-loading { display: block; padding: 24px; text-align: center; }</style>
