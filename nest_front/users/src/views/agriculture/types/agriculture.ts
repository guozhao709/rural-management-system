export interface AgricultureCrop {
  id: number
  code: string
  name: string
  scientificName: string | null
  status: 'active'
  aliases: Array<{ id: number; alias: string }>
}

export interface AgricultureKnowledge {
  id: number
  title: string
  summary: string | null
  content?: string
  category: string
  tags: string[]
  regionCodes: string[]
  sourceName: string | null
  sourceUrl: string | null
  validUntil: string | null
  version: number
  status: 'published'
  cropIds: number[]
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface AnalysisInput {
  cropId: number
  regionCode: string
  regionName: string
  growthStage?: string
  observations?: string[]
  fieldContext?: { soilType?: string; irrigationAvailable?: boolean }
}

export interface AnalysisRisk { type: 'weather' | 'pest' | 'disease' | 'soil' | 'water' | 'other'; level: 'low' | 'medium' | 'high'; description: string; evidence: string[] }
export interface AnalysisAction { priority: 'low' | 'medium' | 'high'; action: string; timing: string; rationale: string }
export interface AnalysisResult {
  schemaVersion: string
  overview: string
  suitability: { level: 'low' | 'medium' | 'high'; score: number; reasons: string[] }
  risks: AnalysisRisk[]
  actions: AnalysisAction[]
  knowledgeReferences: Array<{ knowledgeId: number; version: number; title: string }>
  contextWarnings: string[]
  disclaimer: string
}

export interface AgricultureAnalysis {
  id: string
  cropId: number
  cropName: string
  regionCode: string
  regionName: string
  status: 'processing' | 'succeeded' | 'failed'
  result: AnalysisResult | null
  createdAt: string
  completedAt: string | null
}
