import { reactive, shallowRef } from 'vue'
import { getUserFacingError } from '../../../app/auth'
import { healthApi } from '../api/health'
import type { KnowledgeDetail, KnowledgeFilters, KnowledgeSummary } from '../types/health'

export function useHealthKnowledge() {
  const items = shallowRef<KnowledgeSummary[]>([])
  const selected = shallowRef<KnowledgeDetail | null>(null)
  const total = shallowRef(0)
  const loading = shallowRef(false)
  const loadingDetail = shallowRef(false)
  const errorMessage = shallowRef('')
  const filters = reactive<KnowledgeFilters>({ page: 1, pageSize: 10, q: '', category: '' })
  let requestVersion = 0

  async function load(): Promise<void> {
    const version = ++requestVersion
    loading.value = true
    errorMessage.value = ''
    try {
      const result = await healthApi.getKnowledge({ ...filters, q: filters.q || undefined, category: filters.category || undefined })
      if (version !== requestVersion) return
      items.value = result.items
      total.value = result.total
    } catch (error) {
      if (version === requestVersion) errorMessage.value = getUserFacingError(error)
    } finally {
      if (version === requestVersion) loading.value = false
    }
  }

  async function loadDetail(id: number): Promise<void> {
    loadingDetail.value = true
    errorMessage.value = ''
    try { selected.value = await healthApi.getKnowledgeDetail(id) } catch (error) { selected.value = null; errorMessage.value = getUserFacingError(error) } finally { loadingDetail.value = false }
  }

  return { items, selected, total, loading, loadingDetail, filters, errorMessage, load, loadDetail }
}
