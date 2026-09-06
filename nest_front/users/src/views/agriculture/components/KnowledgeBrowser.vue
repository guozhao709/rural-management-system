<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import { getUserFacingError } from '../../../app/auth'
import { agricultureApi } from '../api/agriculture'
import type { AgricultureKnowledge } from '../types/agriculture'
const items = shallowRef<AgricultureKnowledge[]>([])
const keyword = shallowRef('')
const loading = shallowRef(false)
const errorMessage = shallowRef('')
const detail = shallowRef<AgricultureKnowledge | null>(null)
const detailVisible = shallowRef(false)
async function load(): Promise<void> { loading.value = true; errorMessage.value = ''; try { items.value = (await agricultureApi.knowledge({ keyword: keyword.value.trim() || undefined })).list } catch (error) { errorMessage.value = getUserFacingError(error) } finally { loading.value = false } }
async function showDetail(id: number): Promise<void> { loading.value = true; try { detail.value = await agricultureApi.knowledgeDetail(id); detailVisible.value = true } catch (error) { errorMessage.value = getUserFacingError(error) } finally { loading.value = false } }
onMounted(load)
</script>

<template>
  <section class="knowledge" aria-labelledby="knowledge-heading"><h2 id="knowledge-heading" class="section-title">农业知识</h2><van-search v-model="keyword" placeholder="搜索种植、病虫害等知识" @search="load" /><p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p><van-loading v-if="loading" class="loading">加载中…</van-loading><van-empty v-else-if="!items.length" description="暂无匹配的农业知识" /><van-cell-group v-else inset><van-cell v-for="item in items" :key="item.id" is-link :title="item.title" :label="item.summary ?? '暂无摘要'" @click="showDetail(item.id)"><template #value><van-tag plain type="primary">{{ item.category }}</van-tag></template></van-cell></van-cell-group><van-popup v-model:show="detailVisible" position="bottom" round closeable :style="{ height: '78%' }"><article v-if="detail" class="detail"><p class="category">{{ detail.category }}</p><h2>{{ detail.title }}</h2><p class="content">{{ detail.content }}</p><p v-if="detail.sourceName" class="source">来源：{{ detail.sourceName }}</p><a v-if="detail.sourceUrl" :href="detail.sourceUrl" target="_blank" rel="noopener noreferrer">查看来源</a></article></van-popup></section>
</template>

<style scoped>
.knowledge { padding: 24px 0; }.section-title { padding: 0 16px; margin: 0; font-size: 22px; }.loading { display: block; padding: 30px; text-align: center; }.error { padding: 0 16px; color: var(--color-danger); }.detail { padding: 48px 24px 32px; }.detail h2 { margin: 6px 0 18px; font-size: 24px; }.category { color: var(--color-primary); font-size: 14px; }.content { white-space: pre-wrap; color: var(--color-text-primary); line-height: 1.85; }.source { margin-top: 24px; color: var(--color-text-secondary); font-size: 14px; }
</style>
