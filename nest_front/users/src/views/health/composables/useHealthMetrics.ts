import { reactive, shallowRef } from 'vue'
import { getUserFacingError } from '../../../app/auth'
import { healthApi } from '../api/health'
import type { MetricCreateInput, MetricFilters, MetricRecord, MetricTemplate, MetricTemplateInput, MetricTemplatePatch, MetricTrend } from '../types/health'

export function useHealthMetrics() {
  const records = shallowRef<MetricRecord[]>([])
  const templates = shallowRef<MetricTemplate[]>([])
  const trend = shallowRef<MetricTrend | null>(null)
  const total = shallowRef(0)
  const loadingRecords = shallowRef(false)
  const loadingTemplates = shallowRef(false)
  const loadingTrend = shallowRef(false)
  const saving = shallowRef(false)
  const deletingId = shallowRef<number | null>(null)
  const errorMessage = shallowRef('')
  const filters = reactive<MetricFilters>({ page: 1, pageSize: 10 })

  async function loadRecords(): Promise<void> {
    loadingRecords.value = true
    errorMessage.value = ''
    try { const result = await healthApi.getMetrics({ ...filters }); records.value = result.items; total.value = result.total } catch (error) { errorMessage.value = getUserFacingError(error) } finally { loadingRecords.value = false }
  }

  async function loadTemplates(): Promise<void> {
    loadingTemplates.value = true
    try { templates.value = (await healthApi.getTemplates()).items } catch (error) { errorMessage.value = getUserFacingError(error) } finally { loadingTemplates.value = false }
  }

  async function loadTrend(params: { metricType?: 'weight' | 'temperature' | 'heart_rate' | 'blood_pressure'; templateId?: number; from?: string; to?: string }): Promise<void> {
    loadingTrend.value = true
    errorMessage.value = ''
    try { trend.value = await healthApi.getTrend(params) } catch (error) { trend.value = null; errorMessage.value = getUserFacingError(error) } finally { loadingTrend.value = false }
  }

  async function createRecord(input: MetricCreateInput): Promise<boolean> {
    saving.value = true
    errorMessage.value = ''
    try { await healthApi.createMetric(input); await loadRecords(); return true } catch (error) { errorMessage.value = getUserFacingError(error); return false } finally { saving.value = false }
  }

  async function deleteRecord(id: number): Promise<boolean> {
    deletingId.value = id
    errorMessage.value = ''
    try { await healthApi.deleteMetric(id); await loadRecords(); return true } catch (error) { errorMessage.value = getUserFacingError(error); return false } finally { deletingId.value = null }
  }

  async function createTemplate(input: MetricTemplateInput): Promise<boolean> {
    saving.value = true
    errorMessage.value = ''
    try { await healthApi.createTemplate(input); await loadTemplates(); return true } catch (error) { errorMessage.value = getUserFacingError(error); return false } finally { saving.value = false }
  }

  async function updateTemplate(id: number, input: MetricTemplatePatch): Promise<boolean> {
    saving.value = true
    errorMessage.value = ''
    try { await healthApi.updateTemplate(id, input); await loadTemplates(); return true } catch (error) { errorMessage.value = getUserFacingError(error); return false } finally { saving.value = false }
  }

  return { records, templates, trend, total, filters, loadingRecords, loadingTemplates, loadingTrend, saving, deletingId, errorMessage, loadRecords, loadTemplates, loadTrend, createRecord, deleteRecord, createTemplate, updateTemplate }
}
