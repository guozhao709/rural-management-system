import { request } from '../../../api/request'
import type { ApiEnvelope } from '../../../api/types'
import type { AgricultureAnalysis, AgricultureCrop, AgricultureKnowledge, AnalysisInput, PageResult } from '../types/agriculture'

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null }
function string(value: unknown, field: string, nullable = false): string | null {
  if (nullable && value === null) return null
  if (typeof value !== 'string') throw new Error(`服务器返回的${field}格式无效。`)
  return value
}
function number(value: unknown, field: string): number { if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`服务器返回的${field}格式无效。`); return value }
function stringArray(value: unknown, field: string): string[] { if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) throw new Error(`服务器返回的${field}格式无效。`); return value }
function numberArray(value: unknown, field: string): number[] { if (!Array.isArray(value) || value.some(item => typeof item !== 'number' || !Number.isInteger(item))) throw new Error(`服务器返回的${field}格式无效。`); return value }
function parseCrop(value: unknown): AgricultureCrop {
  if (!isRecord(value) || value.status !== 'active' || !Array.isArray(value.aliases)) throw new Error('服务器返回的作物数据格式无效。')
  return { id: number(value.id, '作物编号'), code: string(value.code, '作物编码')!, name: string(value.name, '作物名称')!, scientificName: string(value.scientificName, '作物学名', true), status: 'active', aliases: value.aliases.map(alias => {
    if (!isRecord(alias)) throw new Error('服务器返回的作物别名格式无效。')
    return { id: number(alias.id, '别名编号'), alias: string(alias.alias, '别名')! }
  }) }
}
function parseKnowledge(value: unknown, detail = false): AgricultureKnowledge {
  if (!isRecord(value) || value.status !== 'published') throw new Error('服务器返回的农业知识格式无效。')
  const knowledge: AgricultureKnowledge = { id: number(value.id, '知识编号'), title: string(value.title, '知识标题')!, summary: string(value.summary, '知识摘要', true), category: string(value.category, '知识分类')!, tags: stringArray(value.tags, '知识标签'), regionCodes: stringArray(value.regionCodes, '适用地区'), sourceName: string(value.sourceName, '知识来源', true), sourceUrl: string(value.sourceUrl, '来源链接', true), validUntil: string(value.validUntil, '有效期', true), version: number(value.version, '知识版本'), status: 'published', cropIds: numberArray(value.cropIds, '关联作物') }
  if (detail) knowledge.content = string(value.content, '知识正文')!
  return knowledge
}
function parseAnalysisResult(value: unknown): NonNullable<AgricultureAnalysis['result']> {
  if (!isRecord(value) || !isRecord(value.suitability) || (value.suitability.level !== 'low' && value.suitability.level !== 'medium' && value.suitability.level !== 'high') || !Array.isArray(value.risks) || !Array.isArray(value.actions) || !Array.isArray(value.knowledgeReferences)) throw new Error('服务器返回的分析结果格式无效。')
  return { schemaVersion: string(value.schemaVersion, '结果版本')!, overview: string(value.overview, '分析概述')!, suitability: { level: value.suitability.level, score: number(value.suitability.score, '适宜度评分'), reasons: stringArray(value.suitability.reasons, '适宜度理由') }, risks: value.risks.map(risk => { if (!isRecord(risk) || (risk.type !== 'weather' && risk.type !== 'pest' && risk.type !== 'disease' && risk.type !== 'soil' && risk.type !== 'water' && risk.type !== 'other') || (risk.level !== 'low' && risk.level !== 'medium' && risk.level !== 'high')) throw new Error('服务器返回的风险提示格式无效。'); return { type: risk.type, level: risk.level, description: string(risk.description, '风险说明')!, evidence: stringArray(risk.evidence, '风险依据') } }), actions: value.actions.map(action => { if (!isRecord(action) || (action.priority !== 'low' && action.priority !== 'medium' && action.priority !== 'high')) throw new Error('服务器返回的行动建议格式无效。'); return { priority: action.priority, action: string(action.action, '行动内容')!, timing: string(action.timing, '行动时机')!, rationale: string(action.rationale, '行动理由')! } }), knowledgeReferences: value.knowledgeReferences.map(reference => { if (!isRecord(reference)) throw new Error('服务器返回的知识引用格式无效。'); return { knowledgeId: number(reference.knowledgeId, '引用知识编号'), version: number(reference.version, '引用知识版本'), title: string(reference.title, '引用知识标题')! } }), contextWarnings: stringArray(value.contextWarnings, '上下文提示'), disclaimer: string(value.disclaimer, '免责声明')! }
}
function parseAnalysis(value: unknown): AgricultureAnalysis {
  if (!isRecord(value) || (value.status !== 'processing' && value.status !== 'succeeded' && value.status !== 'failed')) throw new Error('服务器返回的农业分析格式无效。')
  const result = value.result === null ? null : parseAnalysisResult(value.result)
  return { id: string(value.id, '分析编号')!, cropId: number(value.cropId, '作物编号'), cropName: string(value.cropName, '作物名称')!, regionCode: string(value.regionCode, '地区编码')!, regionName: string(value.regionName, '地区名称')!, status: value.status, result, createdAt: string(value.createdAt, '创建时间')!, completedAt: string(value.completedAt, '完成时间', true) }
}
function parsePage<T>(value: unknown, itemParser: (item: unknown) => T): PageResult<T> {
  if (!isRecord(value) || !Array.isArray(value.list)) throw new Error('服务器返回的分页数据格式无效。')
  return { list: value.list.map(itemParser), total: number(value.total, '总数'), page: number(value.page, '页码'), pageSize: number(value.pageSize, '每页数量') }
}
async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<unknown> }>, parser: (value: unknown) => T): Promise<T> { const response = await promise; return parser(response.data.data) }

export const agricultureApi = {
  crops(keyword = ''): Promise<PageResult<AgricultureCrop>> { return unwrap(request.get<ApiEnvelope<unknown>>('/api/v2/agriculture/crops', { params: { keyword, page: 1, pageSize: 100 } }), value => parsePage(value, parseCrop)) },
  knowledge(params: { keyword?: string; cropId?: number; category?: string; page?: number } = {}): Promise<PageResult<AgricultureKnowledge>> { return unwrap(request.get<ApiEnvelope<unknown>>('/api/v2/agriculture/knowledge', { params: { ...params, pageSize: 20 } }), value => parsePage(value, value => parseKnowledge(value))) },
  knowledgeDetail(id: number): Promise<AgricultureKnowledge> { return unwrap(request.get<ApiEnvelope<unknown>>(`/api/v2/agriculture/knowledge/${id}`), value => parseKnowledge(value, true)) },
  createAnalysis(input: AnalysisInput): Promise<AgricultureAnalysis> { return unwrap(request.post<ApiEnvelope<unknown>>('/api/v2/agriculture/analyses', input, { timeout: 310_000 }), parseAnalysis) },
  analyses(): Promise<PageResult<AgricultureAnalysis>> { return unwrap(request.get<ApiEnvelope<unknown>>('/api/v2/agriculture/analyses', { params: { page: 1, pageSize: 20 } }), value => parsePage(value, parseAnalysis)) },
  analysisDetail(id: string): Promise<AgricultureAnalysis> { return unwrap(request.get<ApiEnvelope<unknown>>(`/api/v2/agriculture/analyses/${id}`), parseAnalysis) },
}
