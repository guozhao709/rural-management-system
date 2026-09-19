import { shallowRef } from 'vue'
import { getUserFacingError } from '../../../app/auth'
import { healthApi } from '../api/health'
import type { AnalysisInput, HealthAnalysisDetail, HealthAnalysisResult, HealthAnalysisSummary } from '../types/health'

export function useHealthAnalysis() {
  const history = shallowRef<HealthAnalysisSummary[]>([])
  const selected = shallowRef<HealthAnalysisDetail | null>(null)
  const result = shallowRef<HealthAnalysisResult | null>(null)
  const total = shallowRef(0)
  const page = shallowRef(1)
  const loadingHistory = shallowRef(false)
  const loadingDetail = shallowRef(false)
  const submitting = shallowRef(false)
  const errorMessage = shallowRef('')

  async function loadHistory(nextPage = page.value): Promise<void> {
    page.value = nextPage
    loadingHistory.value = true
    errorMessage.value = ''
    try { const result = await healthApi.getAnalyses(page.value); history.value = result.items; total.value = result.total } catch (error) { errorMessage.value = getUserFacingError(error) } finally { loadingHistory.value = false }
  }

  async function loadDetail(id: number): Promise<void> {
    loadingDetail.value = true
    errorMessage.value = ''
    try {
      selected.value = await healthApi.getAnalysis(id)
      result.value = null
    } catch (error) { selected.value = null; result.value = null; errorMessage.value = getUserFacingError(error) } finally { loadingDetail.value = false }
  }

  async function create(input: AnalysisInput): Promise<boolean> {
    submitting.value = true
    errorMessage.value = ''
    try { result.value = await healthApi.createAnalysis(input); selected.value = null; await loadHistory(); return true } catch (error) { result.value = null; errorMessage.value = getUserFacingError(error); return false } finally { submitting.value = false }
  }

  return { history, selected, result, total, page, loadingHistory, loadingDetail, submitting, errorMessage, loadHistory, loadDetail, create }
}
