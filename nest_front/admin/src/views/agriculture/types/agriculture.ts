export type CropStatus = 'active' | 'inactive'
export interface Crop { id: number; code: string; name: string; scientificName: string | null; status: CropStatus; aliases: Array<{ id: number; alias: string }> }
export interface Knowledge { id: number; title: string; summary: string | null; content?: string; category: string; tags: string[]; regionCodes: string[]; isGeneral: boolean; sourceName: string | null; sourceUrl: string | null; validUntil: string | null; version: number; status: 'draft' | 'published' | 'archived'; cropIds: number[] }
export interface PageResult<T> { list: T[]; total: number; page: number; pageSize: number }
export interface KnowledgeInput { title: string; summary?: string; content: string; category: string; tags: string[]; regionCodes: string[]; isGeneral: boolean; sourceName?: string; sourceUrl?: string; validUntil?: string; cropIds: number[] }
