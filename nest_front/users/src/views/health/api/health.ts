import { request } from '../../../api/request'
import type { ApiEnvelope } from '../../../api/types'
import type {
  HealthAnalysisCreated,
  AnalysisInput,
  BloodPressureTrend,
  HealthAnalysisDetail,
  HealthAnalysisResult,
  HealthAnalysisSummary,
  HealthProfile,
  HealthProfileInput,
  KnowledgeDetail,
  KnowledgeFilters,
  KnowledgeSummary,
  MetricCreateInput,
  MetricFilters,
  MetricRecord,
  MetricTemplate,
  MetricTemplateInput,
  MetricTemplatePatch,
  MetricTrend,
  MetricType,
  PageResult,
  SingleValueTrend,
  TrendDirection,
} from '../types/health'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new Error(`服务器返回的${field}格式无效。`)
  return value
}

function nullableString(value: unknown, field: string): string | null {
  if (value === null) return null
  return requiredString(value, field)
}

function finiteNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`服务器返回的${field}格式无效。`)
  return value
}

function positiveInteger(value: unknown, field: string): number {
  const number = finiteNumber(value, field)
  if (!Number.isInteger(number) || number <= 0) throw new Error(`服务器返回的${field}格式无效。`)
  return number
}

function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) throw new Error(`服务器返回的${field}格式无效。`)
  return value
}

function parsePage<T>(value: unknown, parseItem: (item: unknown) => T): PageResult<T> {
  if (!isRecord(value) || !Array.isArray(value.items)) throw new Error('服务器返回的分页数据格式无效。')
  return {
    items: value.items.map(parseItem),
    page: positiveInteger(value.page, '页码'),
    pageSize: positiveInteger(value.pageSize, '每页数量'),
    total: finiteNumber(value.total, '总数'),
  }
}

function parseMetricType(value: unknown): MetricRecord['metricType'] {
  if (value === 'weight' || value === 'temperature' || value === 'heart_rate' || value === 'blood_pressure' || value === 'custom') return value
  throw new Error('服务器返回的指标类型无效。')
}

function parseProfile(value: unknown): HealthProfile | null {
  if (value === null) return null
  if (!isRecord(value)) throw new Error('服务器返回的健康档案格式无效。')
  return {
    id: positiveInteger(value.id, '档案编号'),
    sex: nullableString(value.sex, '性别'),
    birthDate: nullableString(value.birthDate, '出生日期'),
    heightCm: value.heightCm === null ? null : finiteNumber(value.heightCm, '身高'),
    smokingStatus: nullableString(value.smokingStatus, '吸烟情况'),
    drinkingStatus: nullableString(value.drinkingStatus, '饮酒情况'),
    exerciseStatus: nullableString(value.exerciseStatus, '运动情况'),
    sleepStatus: nullableString(value.sleepStatus, '睡眠情况'),
    healthHistory: nullableString(value.healthHistory, '健康史'),
    allergies: nullableString(value.allergies, '过敏情况'),
    createdAt: requiredString(value.createdAt, '创建时间'),
    updatedAt: requiredString(value.updatedAt, '更新时间'),
  }
}

function parseMetric(value: unknown): MetricRecord {
  if (!isRecord(value)) throw new Error('服务器返回的指标记录格式无效。')
  const metricType = parseMetricType(value.metricType)
  const base = {
    id: positiveInteger(value.id, '指标编号'),
    metricType,
    unit: requiredString(value.unit, '指标单位'),
    measuredAt: requiredString(value.measuredAt, '测量时间'),
    createdAt: requiredString(value.createdAt, '创建时间'),
  }
  if (metricType === 'blood_pressure') return { ...base, systolic: finiteNumber(value.systolic, '收缩压'), diastolic: finiteNumber(value.diastolic, '舒张压') }
  return { ...base, value: finiteNumber(value.value, '指标值') }
}

function parseRelatedSystemMetricType(value: unknown): MetricTemplate['relatedSystemMetricType'] {
  if (value === null) return null
  if (value === 'weight' || value === 'temperature' || value === 'heart_rate' || value === 'blood_pressure') return value
  throw new Error('服务器返回的关联指标类型无效。')
}

function parseTemplate(value: unknown): MetricTemplate {
  if (!isRecord(value)) throw new Error('服务器返回的指标模板格式无效。')
  return {
    id: positiveInteger(value.id, '模板编号'),
    name: requiredString(value.name, '模板名称'),
    metricName: requiredString(value.metricName, '指标名称'),
    unit: requiredString(value.unit, '指标单位'),
    relatedSystemMetricType: parseRelatedSystemMetricType(value.relatedSystemMetricType),
    startedAt: requiredString(value.startedAt, '开始时间'),
    endedAt: nullableString(value.endedAt, '结束时间'),
    createdAt: requiredString(value.createdAt, '创建时间'),
    updatedAt: requiredString(value.updatedAt, '更新时间'),
  }
}

function parseTrendDirection(value: unknown): TrendDirection {
  if (value === 'up' || value === 'down' || value === 'stable') return value
  throw new Error('服务器返回的趋势方向无效。')
}

function nullableFiniteNumber(value: unknown, field: string): number | null {
  if (value === null) return null
  return finiteNumber(value, field)
}

function parseStatistics(value: unknown): SingleValueTrend['statistics'] {
  if (!isRecord(value)) throw new Error('服务器返回的统计数据格式无效。')
  return {
    latest: nullableFiniteNumber(value.latest, '最新值'),
    average: nullableFiniteNumber(value.average, '平均值'),
    min: nullableFiniteNumber(value.min, '最小值'),
    max: nullableFiniteNumber(value.max, '最大值'),
    change: nullableFiniteNumber(value.change, '变化量'),
    trend: parseTrendDirection(value.trend),
  }
}

function parseTrend(value: unknown): MetricTrend {
  if (!isRecord(value) || !isRecord(value.target) || !Array.isArray(value.points) || !isRecord(value.statistics)) throw new Error('服务器返回的趋势数据格式无效。')
  const type = requiredString(value.target.type, '趋势类型')
  const unit = nullableString(value.target.unit, '趋势单位')
  if (type === 'blood_pressure') {
    if (unit !== 'mmHg') throw new Error('服务器返回的血压趋势单位无效。')
    const statistics = value.statistics
    if (!isRecord(statistics)) throw new Error('服务器返回的血压统计数据格式无效。')
    return {
      target: { type: 'blood_pressure', unit: 'mmHg' },
      points: value.points.map(point => {
        if (!isRecord(point)) throw new Error('服务器返回的血压趋势点格式无效。')
        return { measuredAt: requiredString(point.measuredAt, '测量时间'), systolic: finiteNumber(point.systolic, '收缩压'), diastolic: finiteNumber(point.diastolic, '舒张压') }
      }),
      statistics: { systolic: parseStatistics(statistics.systolic), diastolic: parseStatistics(statistics.diastolic) },
    } satisfies BloodPressureTrend
  }
  if (type !== 'weight' && type !== 'temperature' && type !== 'heart_rate' && type !== 'custom') throw new Error('服务器返回的趋势类型无效。')
  return {
    target: { type, unit },
    points: value.points.map(point => {
      if (!isRecord(point)) throw new Error('服务器返回的趋势点格式无效。')
      return { measuredAt: requiredString(point.measuredAt, '测量时间'), value: finiteNumber(point.value, '指标值') }
    }),
    statistics: parseStatistics(value.statistics),
  } satisfies SingleValueTrend
}

function parseReference(value: unknown): HealthAnalysisResult['references'][number] {
  if (!isRecord(value)) throw new Error('服务器返回的知识引用格式无效。')
  return { knowledgeId: positiveInteger(value.knowledgeId, '知识编号'), title: requiredString(value.title, '知识标题'), source: requiredString(value.source, '知识来源') }
}

function parseAnalysisResult(value: unknown): HealthAnalysisResult {
  if (!isRecord(value)) throw new Error('服务器返回的分析结果格式无效。')
  return {
    summary: requiredString(value.summary, '分析概况'),
    concerns: stringArray(value.concerns, '关注事项'),
    factors: stringArray(value.factors, '可能因素'),
    suggestions: stringArray(value.suggestions, '日常建议'),
    medicalAdvice: requiredString(value.medicalAdvice, '就医提示'),
    references: !Array.isArray(value.references) ? (() => { throw new Error('服务器返回的知识引用格式无效。') })() : value.references.map(parseReference),
  }
}

function parseAnalysisSummary(value: unknown): HealthAnalysisSummary {
  if (!isRecord(value)) throw new Error('服务器返回的分析历史格式无效。')
  return { id: positiveInteger(value.id, '分析编号'), symptoms: stringArray(value.symptoms, '症状'), severity: requiredString(value.severity, '严重程度'), summary: requiredString(value.summary, '分析概况'), createdAt: requiredString(value.createdAt, '创建时间') }
}

function parseAnalysisDetail(value: unknown): HealthAnalysisDetail {
  if (!isRecord(value) || !isRecord(value.input) || !isRecord(value.context) || !isRecord(value.result)) throw new Error('服务器返回的分析详情格式无效。')
  return {
    id: positiveInteger(value.id, '分析编号'),
    input: value.input,
    context: value.context,
    result: value.result,
    createdAt: requiredString(value.createdAt, '创建时间'),
  }
}

function parseCreatedAnalysis(value: unknown): HealthAnalysisCreated {
  if (!isRecord(value)) throw new Error('服务器返回的分析结果格式无效。')
  return { id: positiveInteger(value.id, '分析编号'), ...parseAnalysisResult(value), createdAt: requiredString(value.createdAt, '创建时间') }
}

function parseKnowledgeSummary(value: unknown): KnowledgeSummary {
  if (!isRecord(value)) throw new Error('服务器返回的健康知识格式无效。')
  return { id: positiveInteger(value.id, '知识编号'), title: requiredString(value.title, '知识标题'), summary: nullableString(value.summary, '知识摘要'), category: requiredString(value.category, '知识分类'), tags: stringArray(value.tags, '知识标签'), sourceName: requiredString(value.sourceName, '知识来源') }
}

function parseKnowledgeDetail(value: unknown): KnowledgeDetail {
  if (!isRecord(value) || !isRecord(value.source)) throw new Error('服务器返回的知识详情格式无效。')
  return { ...parseKnowledgeSummary(value), content: requiredString(value.content, '知识正文'), source: { name: requiredString(value.source.name, '来源名称'), url: nullableString(value.source.url, '来源链接') }, createdAt: requiredString(value.createdAt, '创建时间'), updatedAt: requiredString(value.updatedAt, '更新时间') }
}

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/
const explicitOffsetDateTimePattern = /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:?\d{2})$/

function serializeDateFilter(value: string, boundary: 'from' | 'to'): string {
  if (dateOnlyPattern.test(value)) {
    const date = new Date(`${value}T${boundary === 'from' ? '00:00:00.000' : '23:59:59.999'}`)
    if (Number.isNaN(date.getTime())) throw new Error('日期筛选格式无效。')
    return date.toISOString()
  }
  if (!explicitOffsetDateTimePattern.test(value)) throw new Error('日期筛选格式无效。')
  return value
}

function normalizeDateFilters(params: { from?: string; to?: string }): { from?: string; to?: string } {
  return {
    ...(params.from ? { from: serializeDateFilter(params.from, 'from') } : {}),
    ...(params.to ? { to: serializeDateFilter(params.to, 'to') } : {}),
  }
}

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<unknown> }>, parser: (value: unknown) => T): Promise<T> {
  const response = await promise
  return parser(response.data.data)
}

export const healthApi = {
  getProfile(): Promise<HealthProfile | null> { return unwrap(request.get<ApiEnvelope<unknown>>('/api/health/profile'), parseProfile) },
  saveProfile(input: HealthProfileInput): Promise<HealthProfile> { return unwrap(request.put<ApiEnvelope<unknown>>('/api/health/profile', input), value => { const profile = parseProfile(value); if (!profile) throw new Error('服务器未返回保存后的健康档案。'); return profile }) },
  getMetrics(filters: MetricFilters): Promise<PageResult<MetricRecord>> { const { from, to, ...rest } = filters; return unwrap(request.get<ApiEnvelope<unknown>>('/api/health/metrics', { params: { ...rest, ...normalizeDateFilters({ from, to }) } }), value => parsePage(value, parseMetric)) },
  createMetric(input: MetricCreateInput): Promise<MetricRecord> { return unwrap(request.post<ApiEnvelope<unknown>>('/api/health/metrics', input), parseMetric) },
  deleteMetric(id: number): Promise<void> { return unwrap(request.delete<ApiEnvelope<unknown>>(`/api/health/metrics/${id}`), value => { if (value !== null) throw new Error('服务器返回的删除结果格式无效。'); return undefined }) },
  getTrend(params: { metricType?: Exclude<MetricType, 'custom' | 'blood_pressure'> | 'blood_pressure'; templateId?: number; from?: string; to?: string }): Promise<MetricTrend> { const { from, to, ...rest } = params; return unwrap(request.get<ApiEnvelope<unknown>>('/api/health/metrics/trend', { params: { ...rest, ...normalizeDateFilters({ from, to }) } }), parseTrend) },
  getTemplates(active: 'true' | 'false' = 'true'): Promise<PageResult<MetricTemplate>> { return unwrap(request.get<ApiEnvelope<unknown>>('/api/health/metric-templates', { params: { active, page: 1, pageSize: 100 } }), value => parsePage(value, parseTemplate)) },
  createTemplate(input: MetricTemplateInput): Promise<MetricTemplate> { return unwrap(request.post<ApiEnvelope<unknown>>('/api/health/metric-templates', input), parseTemplate) },
  getTemplate(id: number): Promise<MetricTemplate> { return unwrap(request.get<ApiEnvelope<unknown>>(`/api/health/metric-templates/${id}`), parseTemplate) },
  updateTemplate(id: number, input: MetricTemplatePatch): Promise<MetricTemplate> { return unwrap(request.patch<ApiEnvelope<unknown>>(`/api/health/metric-templates/${id}`, input), parseTemplate) },
  createAnalysis(input: AnalysisInput): Promise<HealthAnalysisCreated> { return unwrap(request.post<ApiEnvelope<unknown>>('/api/health/analyses', input, { timeout: 310_000 }), parseCreatedAnalysis) },
  getAnalyses(page = 1, pageSize = 20): Promise<PageResult<HealthAnalysisSummary>> { return unwrap(request.get<ApiEnvelope<unknown>>('/api/health/analyses', { params: { page, pageSize } }), value => parsePage(value, parseAnalysisSummary)) },
  getAnalysis(id: number): Promise<HealthAnalysisDetail> { return unwrap(request.get<ApiEnvelope<unknown>>(`/api/health/analyses/${id}`), parseAnalysisDetail) },
  getKnowledge(filters: KnowledgeFilters): Promise<PageResult<KnowledgeSummary>> { return unwrap(request.get<ApiEnvelope<unknown>>('/api/health/knowledge', { params: filters }), value => parsePage(value, parseKnowledgeSummary)) },
  getKnowledgeDetail(id: number): Promise<KnowledgeDetail> { return unwrap(request.get<ApiEnvelope<unknown>>(`/api/health/knowledge/${id}`), parseKnowledgeDetail) },
}
