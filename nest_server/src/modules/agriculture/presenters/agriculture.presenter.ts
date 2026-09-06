import { Crop } from '../entities/crop.entity';
import { AgricultureKnowledge } from '../entities/agriculture-knowledge.entity';
import { CropAnalysis } from '../entities/crop-analysis.entity';

export class CropPresenter {
  static from(crop: Crop) {
    return {
      id: crop.id,
      code: crop.code,
      name: crop.name,
      scientificName: crop.scientificName,
      status: crop.status,
      aliases: crop.aliases.isInitialized()
        ? crop.aliases.getItems().map((alias) => ({ id: alias.id, alias: alias.alias }))
        : [],
    };
  }
}
export class KnowledgePresenter {
  static from(entity: AgricultureKnowledge, detail = false) {
    return {
      id: entity.id,
      title: entity.title,
      summary: entity.summary,
      ...(detail ? { content: entity.content } : {}),
      category: entity.category,
      tags: entity.tags,
      regionCodes: entity.regionCodes,
      sourceName: entity.sourceName,
      sourceUrl: entity.sourceUrl,
      validUntil: entity.validUntil,
      version: entity.version,
      status: entity.status,
      cropIds: entity.crops.isInitialized() ? entity.crops.getItems().map((crop) => crop.id) : [],
    };
  }
}
export class AnalysisPresenter {
  static from(entity: CropAnalysis) {
    return {
      id: String(entity.id),
      cropId: entity.crop.id,
      cropName: entity.cropNameSnapshot,
      regionCode: entity.regionCode,
      regionName: entity.regionName,
      status: entity.status,
      result: entity.result,
      schemaVersion: entity.schemaVersion,
      promptVersion: entity.promptVersion,
      modelProvider: entity.modelProvider,
      modelName: entity.modelName,
      durationMs: entity.durationMs,
      createdAt: entity.createdAt.toISOString(),
      completedAt: entity.completedAt?.toISOString() ?? null,
    };
  }
}
