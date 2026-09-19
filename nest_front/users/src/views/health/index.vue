<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { getUserFacingError } from '../../app/auth'
import { useHealthAnalysis } from './composables/useHealthAnalysis'
import { useHealthKnowledge } from './composables/useHealthKnowledge'
import { useHealthMetrics } from './composables/useHealthMetrics'
import { useHealthProfile } from './composables/useHealthProfile'
import AnalysisForm from './components/AnalysisForm.vue'
import AnalysisResult from './components/AnalysisResult.vue'
import KnowledgeList from './components/KnowledgeList.vue'
import MetricHistory from './components/MetricHistory.vue'
import MetricRecordForm from './components/MetricRecordForm.vue'
import MetricTemplatePanel from './components/MetricTemplatePanel.vue'
import MetricTrendChart from './components/MetricTrendChart.vue'
import ProfileForm from './components/ProfileForm.vue'
import type { AnalysisInput, HealthAnalysisResult, HealthProfileInput, MetricCreateInput, MetricTemplateInput, MetricType } from './types/health'

defineOptions({ name: 'HealthServiceView' })
const router = useRouter()
const activeTab = shallowRef('profile')
const profile = useHealthProfile()
const metrics = useHealthMetrics()
const analysis = useHealthAnalysis()
const knowledge = useHealthKnowledge()
const { profile: profileValue, loading: profileLoading, saving: profileSaving, errorMessage: profileError } = profile
const { records: metricRecords, templates, trend, total: metricTotal, loadingRecords, loadingTemplates, loadingTrend, saving: metricsSaving, deletingId, errorMessage: metricsError } = metrics
const { history: analysisHistory, selected: selectedAnalysis, result: latestAnalysisResult, total: analysisTotal, page: analysisPage, loadingHistory, loadingDetail: loadingAnalysisDetail, submitting: analysisSubmitting, errorMessage: analysisError } = analysis
const { items: knowledgeItems, selected: selectedKnowledge, loading: knowledgeLoading, loadingDetail: loadingKnowledgeDetail, total: knowledgeTotal, filters: knowledgeFilters, errorMessage: knowledgeError } = knowledge
const selectedMetricType = shallowRef<Exclude<MetricType, 'custom'>>('weight')
const selectedTemplateId = shallowRef<number | null>(null)
const metricFrom = shallowRef('')
const metricTo = shallowRef('')
const analysisOpen = shallowRef(false)
const knowledgeOpen = shallowRef(false)
const pageError = shallowRef('')

function snapshotText(value: unknown, fallback = '未填写'): string { return typeof value === 'string' && value ? value : fallback }
function snapshotSymptoms(value: unknown): string { return Array.isArray(value) ? value.filter(item => typeof item === 'string').join('、') || '未填写' : '未填写' }

function renderableAnalysisResult(value: Record<string, unknown>): HealthAnalysisResult | null {
  const arrays = ['concerns', 'factors', 'suggestions']
  if (typeof value.summary !== 'string' || typeof value.medicalAdvice !== 'string' || !arrays.every(key => Array.isArray(value[key]) && value[key].every(item => typeof item === 'string')) || !Array.isArray(value.references)) return null
  const references = value.references.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item))
  if (references.length !== value.references.length || references.some(item => typeof item.knowledgeId !== 'number' || !Number.isInteger(item.knowledgeId) || item.knowledgeId <= 0 || typeof item.title !== 'string' || typeof item.source !== 'string')) return null
  return { summary: value.summary, concerns: value.concerns as string[], factors: value.factors as string[], suggestions: value.suggestions as string[], medicalAdvice: value.medicalAdvice, references: references.map(item => ({ knowledgeId: item.knowledgeId as number, title: item.title as string, source: item.source as string })) }
}

async function run(task: () => Promise<void>): Promise<void> { try { await task() } catch (error) { pageError.value = getUserFacingError(error) } }
async function saveProfile(input: HealthProfileInput): Promise<void> { await profile.save(input) }
async function createMetric(input: MetricCreateInput): Promise<void> { if (await metrics.createRecord(input)) await refreshTrend() }
async function refreshTrend(): Promise<void> { await metrics.loadTrend(selectedTemplateId.value ? { templateId: selectedTemplateId.value, from: metricFrom.value || undefined, to: metricTo.value || undefined } : { metricType: selectedMetricType.value, from: metricFrom.value || undefined, to: metricTo.value || undefined }) }
async function changeMetricTarget(): Promise<void> { selectedTemplateId.value = null; metrics.filters.metricType = selectedMetricType.value; metrics.filters.templateId = undefined; metrics.filters.page = 1; await Promise.all([metrics.loadRecords(), refreshTrend()]) }
async function changeTemplateTarget(): Promise<void> { if (!selectedTemplateId.value) { await changeMetricTarget(); return } metrics.filters.metricType = undefined; metrics.filters.templateId = selectedTemplateId.value; metrics.filters.page = 1; await Promise.all([metrics.loadRecords(), refreshTrend()]) }
async function changeMetricDateFilter(): Promise<void> { metrics.filters.from = metricFrom.value || undefined; metrics.filters.to = metricTo.value || undefined; metrics.filters.page = 1; await Promise.all([metrics.loadRecords(), refreshTrend()]) }
async function deleteMetric(id: number): Promise<void> { if (await metrics.deleteRecord(id)) await refreshTrend() }
async function createTemplate(input: MetricTemplateInput): Promise<void> { await metrics.createTemplate(input) }
async function endTemplate(id: number): Promise<void> { if (await metrics.updateTemplate(id, { endedAt: new Date().toISOString() }) && selectedTemplateId.value === id) { selectedTemplateId.value = null; await changeMetricTarget() } }
async function submitAnalysis(input: AnalysisInput): Promise<void> { await analysis.create(input) }
async function selectAnalysis(id: number): Promise<void> { await analysis.loadDetail(id); analysisOpen.value = true }
function updateAnalysisPage(page: number): void { void analysis.loadHistory(page) }
async function searchKnowledge(filters: { q: string; category: string }): Promise<void> { Object.assign(knowledge.filters, filters, { page: 1 }); await knowledge.load() }
async function selectKnowledge(id: number): Promise<void> { await knowledge.loadDetail(id); knowledgeOpen.value = true }
function updateKnowledgePage(page: number): void { knowledge.filters.page = page; void knowledge.load() }

onMounted(() => { void run(profile.load); void run(metrics.loadRecords); void run(metrics.loadTemplates); void run(analysis.loadHistory); void run(knowledge.load); void run(() => metrics.loadTrend({ metricType: selectedMetricType.value })) })
</script>

<template>
  <main class="health-page">
    <van-nav-bar title="健康服务" left-text="返回" left-arrow @click-left="router.push({ name: 'user-home' })" />
    <section class="health-hero"><p class="brand">智乡云 · 健康</p><h1>照顾好每一次记录</h1><p>从健康档案、指标趋势到日常知识，持续积累属于你的健康上下文。</p></section>
    <p v-if="pageError" class="page-error" role="alert">{{ pageError }}</p>
    <van-tabs v-model:active="activeTab" sticky animated>
      <van-tab title="健康档案" name="profile"><div class="tab-content"><ProfileForm :profile="profileValue" :loading="profileLoading" :saving="profileSaving" :error-message="profileError" @save="saveProfile" /></div></van-tab>
      <van-tab title="指标趋势" name="metrics"><div class="tab-content metrics-layout"><MetricRecordForm :templates="templates" :submitting="metricsSaving" @submit="createMetric" /><section class="health-card filter-card"><div class="filter-row"><label>查看指标<select v-model="selectedMetricType" @change="changeMetricTarget"><option value="weight">体重</option><option value="temperature">体温</option><option value="heart_rate">心率</option><option value="blood_pressure">血压</option></select></label><label>自定义模板<select v-model="selectedTemplateId" @change="changeTemplateTarget"><option :value="null">不使用模板</option><option v-for="template in templates" :key="template.id" :value="template.id">{{ template.name }}</option></select></label></div><div class="filter-row"><label>开始日期<input v-model="metricFrom" type="date" @change="changeMetricDateFilter" /></label><label>结束日期<input v-model="metricTo" type="date" @change="changeMetricDateFilter" /></label></div></section><MetricTrendChart :trend="trend" :loading="loadingTrend" /><MetricHistory :records="metricRecords" :loading="loadingRecords" :total="metricTotal" :page="metrics.filters.page" :page-size="metrics.filters.pageSize" :deleting-id="deletingId" @delete="deleteMetric" @page-change="page => { metrics.filters.page = page; void metrics.loadRecords() }" /><MetricTemplatePanel :templates="templates" :loading="loadingTemplates" :saving="metricsSaving" @create="createTemplate" @end="endTemplate" /><p v-if="metricsError" class="page-error" role="alert">{{ metricsError }}</p></div></van-tab>
      <van-tab title="AI 分析" name="analysis"><div class="tab-content analysis-layout"><AnalysisForm :submitting="analysisSubmitting" :error-message="analysisError" @submit="submitAnalysis" /><AnalysisResult :result="latestAnalysisResult" @knowledge="selectKnowledge" /><section class="health-card"><div class="section-heading"><div><p class="eyebrow">历史分析</p><h2>回顾过去的记录</h2></div></div><van-loading v-if="loadingHistory" class="inline-loading">正在加载历史…</van-loading><van-empty v-else-if="!analysisHistory.length" image="search" description="暂无分析历史" /><div v-else class="analysis-history"><button v-for="item in analysisHistory" :key="item.id" type="button" class="history-item" @click="selectAnalysis(item.id)"><span><strong>{{ item.summary }}</strong><small>{{ item.createdAt }}</small></span><span aria-hidden="true">›</span></button><div v-if="analysisTotal > 20" class="history-pager"><van-button size="small" plain :disabled="analysisPage <= 1" @click="updateAnalysisPage(analysisPage - 1)">上一页</van-button><span>第 {{ analysisPage }} 页</span><van-button size="small" plain :disabled="analysisPage * 20 >= analysisTotal" @click="updateAnalysisPage(analysisPage + 1)">下一页</van-button></div></div></section></div></van-tab>
      <van-tab title="健康知识" name="knowledge"><div class="tab-content"><KnowledgeList :items="knowledgeItems" :loading="knowledgeLoading" :error-message="knowledgeError" :total="knowledgeTotal" :page="knowledgeFilters.page" :page-size="knowledgeFilters.pageSize" :filters="knowledgeFilters" @search="searchKnowledge" @select="selectKnowledge" @page-change="updateKnowledgePage" /></div></van-tab>
    </van-tabs>
    <van-popup v-model:show="analysisOpen" position="bottom" round :style="{ height: '80%' }"><div class="popup-content"><van-nav-bar title="分析详情" left-arrow @click-left="analysisOpen = false" /><van-loading v-if="loadingAnalysisDetail" class="inline-loading">正在加载详情…</van-loading><template v-else-if="selectedAnalysis"><p class="popup-meta">{{ selectedAnalysis.createdAt }}</p><section class="snapshot"><h3>当时的输入</h3><p>症状：{{ snapshotSymptoms(selectedAnalysis.input.symptoms) }}</p><p>严重程度：{{ snapshotText(selectedAnalysis.input.severity) }} · 持续时间：{{ snapshotText(selectedAnalysis.input.duration) }}</p><p>{{ snapshotText(selectedAnalysis.input.description, '未补充描述') }}</p><h3>系统上下文快照</h3><pre>{{ JSON.stringify(selectedAnalysis.context, null, 2) }}</pre></section><AnalysisResult :result="renderableAnalysisResult(selectedAnalysis.result)" @knowledge="selectKnowledge" /></template><van-empty v-else description="分析详情不可用或已不存在" /></div></van-popup>
    <van-popup v-model:show="knowledgeOpen" position="bottom" round :style="{ height: '80%' }"><div class="popup-content"><van-nav-bar title="知识详情" left-arrow @click-left="knowledgeOpen = false" /><van-loading v-if="loadingKnowledgeDetail" class="inline-loading">正在加载详情…</van-loading><template v-else-if="selectedKnowledge"><article class="knowledge-detail"><h2>{{ selectedKnowledge.title }}</h2><p class="source">来源：{{ selectedKnowledge.source.name }}</p><p class="knowledge-content">{{ selectedKnowledge.content }}</p><a v-if="selectedKnowledge.source.url" :href="selectedKnowledge.source.url" target="_blank" rel="noreferrer">打开来源链接</a><span v-else class="source-unavailable">暂无来源链接</span></article></template><van-empty v-else description="知识详情不可用或已不存在" /></div></van-popup>
  </main>
</template>

<style scoped>
.health-page { min-height: 100svh; background: var(--color-bg-secondary); }.health-hero { padding: 24px 20px 20px; background: linear-gradient(135deg, var(--color-health-soft), var(--color-bg-primary)); }.brand { margin: 0 0 8px; color: var(--color-health); font-size: 14px; font-weight: 700; }.health-hero h1 { margin: 0 0 8px; color: var(--color-text-primary); font-size: 28px; }.health-hero p:last-child { max-width: 520px; margin: 0; color: var(--color-text-secondary); font-size: 16px; line-height: 1.6; }.tab-content { display: grid; gap: 12px; padding: 12px 12px 32px; }.metrics-layout, .analysis-layout { max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; }.health-card { padding: 20px 16px; background: var(--color-bg-primary); border-radius: 16px; }.filter-card { display: grid; gap: 12px; }.filter-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }.filter-row label { display: grid; gap: 6px; color: var(--color-text-primary); font-size: 14px; }.filter-row select, .filter-row input { box-sizing: border-box; width: 100%; padding: 9px 10px; border: 1px solid var(--color-divider); border-radius: 10px; background: var(--color-bg-primary); color: var(--color-text-primary); font: inherit; }.section-heading { display: flex; align-items: center; justify-content: space-between; }.eyebrow { margin: 0 0 4px; color: var(--color-health); font-size: 14px; font-weight: 600; }.section-heading h2 { margin: 0; color: var(--color-text-primary); font-size: 20px; }.inline-loading { padding: 24px 0; text-align: center; }.page-error { margin: 12px; padding: 10px 12px; border-radius: 10px; background: rgb(232 64 38 / 10%); color: var(--color-danger); line-height: 1.5; }.analysis-history { margin-top: 12px; }.history-item { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 12px; padding: 12px 0; border: 0; border-top: 1px solid var(--color-divider); background: transparent; text-align: left; font: inherit; }.history-item strong, .history-item small { display: block; }.history-item small { margin-top: 4px; color: var(--color-text-tertiary); }.history-item > span:last-child { color: var(--color-primary); font-size: 24px; }.history-pager { display: flex; justify-content: center; align-items: center; gap: 12px; padding-top: 12px; color: var(--color-text-secondary); font-size: 13px; }.popup-content { height: 100%; overflow: auto; background: var(--color-bg-secondary); }.popup-meta { margin: 16px; color: var(--color-text-tertiary); font-size: 14px; }.popup-content .health-card { margin: 0 12px 20px; }.snapshot { margin: 0 12px 12px; padding: 16px; background: var(--color-bg-primary); border-radius: 16px; color: var(--color-text-secondary); line-height: 1.6; }.snapshot h3 { margin: 0 0 8px; color: var(--color-text-primary); font-size: 16px; }.snapshot p { margin: 5px 0; }.snapshot pre { overflow: auto; margin: 0; padding: 10px; border-radius: 8px; background: var(--color-bg-secondary); white-space: pre-wrap; font: 13px/1.5 ui-monospace, Consolas, monospace; }.knowledge-detail { padding: 20px; background: var(--color-bg-primary); }.knowledge-detail h2 { margin: 0 0 8px; color: var(--color-text-primary); }.source { color: var(--color-text-secondary); font-size: 14px; }.knowledge-content { white-space: pre-wrap; color: var(--color-text-primary); line-height: 1.8; }.knowledge-detail a { color: var(--color-primary); }@media (max-width: 520px) { .filter-row { grid-template-columns: 1fr; } }
</style>
