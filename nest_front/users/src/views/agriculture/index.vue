<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { getUserFacingError } from '../../app/auth'
import { agricultureApi } from './api/agriculture'
import AnalysisOutcome from './components/AnalysisOutcome.vue'
import AnalysisHistory from './components/AnalysisHistory.vue'
import CropAnalysisForm from './components/CropAnalysisForm.vue'
import KnowledgeBrowser from './components/KnowledgeBrowser.vue'
import type { AgricultureAnalysis, AgricultureCrop, AnalysisInput } from './types/agriculture'
defineOptions({ name: 'AgricultureServiceView' })
const router = useRouter(); const crops = shallowRef<AgricultureCrop[]>([]); const loadingCrops = shallowRef(true); const submitting = shallowRef(false); const errorMessage = shallowRef(''); const analysis = shallowRef<AgricultureAnalysis | null>(null); const history = shallowRef<AgricultureAnalysis[]>([]); const loadingHistory = shallowRef(true)
async function loadCrops(): Promise<void> { try { crops.value = (await agricultureApi.crops()).list } catch (error) { errorMessage.value = getUserFacingError(error) } finally { loadingCrops.value = false } }
async function loadHistory(): Promise<void> { try { history.value = (await agricultureApi.analyses()).list } catch (error) { errorMessage.value = getUserFacingError(error) } finally { loadingHistory.value = false } }
async function submit(input: AnalysisInput): Promise<void> { submitting.value = true; errorMessage.value = ''; try { analysis.value = await agricultureApi.createAnalysis(input); await loadHistory() } catch (error) { errorMessage.value = getUserFacingError(error) } finally { submitting.value = false } }
onMounted(() => { void loadCrops(); void loadHistory() })
</script>

<template><main class="agriculture-page"><van-nav-bar title="农业服务" left-text="返回" left-arrow @click-left="router.push({ name: 'user-home' })" /><p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p><van-tabs sticky><van-tab title="智能分析"><van-loading v-if="loadingCrops" class="page-loading">正在加载作物…</van-loading><CropAnalysisForm v-else :crops="crops" :submitting="submitting" @submit="submit" /></van-tab><van-tab title="分析结果"><AnalysisOutcome :analysis="analysis" /><van-empty v-if="!analysis" description="完成一次田间分析后在这里查看结果" /><AnalysisHistory :items="history" :loading="loadingHistory" @select="analysis = $event" /></van-tab><van-tab title="农业知识"><KnowledgeBrowser /></van-tab></van-tabs></main></template>

<style scoped>.agriculture-page { min-height: 100svh; background: var(--color-bg-secondary); }.error { margin: 12px 16px 0; color: var(--color-danger); }.page-loading { display: block; padding: 48px; text-align: center; }</style>
