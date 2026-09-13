<script setup lang="ts">
import { shallowRef } from 'vue'
import type { HealthKnowledge } from '../types/health'
defineProps<{ items: HealthKnowledge[]; loading: boolean }>()
const emit = defineEmits<{ search: [keyword: string] }>()
const keyword = shallowRef('')
function search(): void { emit('search', keyword.value.trim()) }
</script>
<template><section class="panel"><h2>公共健康知识</h2><van-search v-model="keyword" placeholder="搜索健康知识" @search="search" /><van-loading v-if="loading">正在加载…</van-loading><van-empty v-else-if="!items.length" description="暂无可用的健康知识" /><van-cell-group v-else inset><van-cell v-for="item in items" :key="`${item.knowledgeId}-${item.version}`" :title="item.title" :label="item.excerpt" is-link :url="item.sourceUrl"><template #value><span class="source">{{ item.sourceName }}</span></template></van-cell></van-cell-group></section></template>
<style scoped>.panel { display: grid; gap: 8px; padding: 16px; }.panel h2 { margin: 0; font-size: 20px; }.source { color: var(--color-text-secondary); font-size: 12px; }</style>
