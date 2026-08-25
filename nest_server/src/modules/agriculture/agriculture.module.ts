import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  AgricultureController,
  AdminAgricultureController,
} from './controllers/agriculture.controller';
import { Crop } from './entities/crop.entity';
import { CropAlias } from './entities/crop-alias.entity';
import { AgricultureKnowledge } from './entities/agriculture-knowledge.entity';
import { CropAnalysis } from './entities/crop-analysis.entity';
import { CropAnalysisKnowledgeRef } from './entities/crop-analysis-knowledge-ref.entity';
import { STRUCTURED_LLM_PORT } from './ports/structured-llm.port';
import { WEATHER_CONTEXT_PORT } from './ports/weather-context.port';
import { UnavailableStructuredLlmAdapter } from './adapters/unavailable-llm.adapter';
import { UnavailableWeatherAdapter } from './adapters/unavailable-weather.adapter';
import { OpenAiCompatibleStructuredLlmAdapter } from './adapters/openai-compatible-structured-llm.adapter';
import { AgricultureAnalysisService } from './services/agriculture-analysis.service';
import { AgricultureKnowledgeService } from './services/agriculture-knowledge.service';
import { AgricultureRetrievalFacade } from './services/agriculture-retrieval.facade';
import { CropCatalogService } from './services/crop-catalog.service';
@Module({
  imports: [
    MikroOrmModule.forFeature([
      Crop,
      CropAlias,
      AgricultureKnowledge,
      CropAnalysis,
      CropAnalysisKnowledgeRef,
    ]),
  ],
  controllers: [AgricultureController, AdminAgricultureController],
  providers: [
    CropCatalogService,
    AgricultureKnowledgeService,
    AgricultureAnalysisService,
    AgricultureRetrievalFacade,
    UnavailableStructuredLlmAdapter,
    OpenAiCompatibleStructuredLlmAdapter,
    UnavailableWeatherAdapter,
    { provide: STRUCTURED_LLM_PORT, useExisting: OpenAiCompatibleStructuredLlmAdapter },
    { provide: WEATHER_CONTEXT_PORT, useExisting: UnavailableWeatherAdapter },
  ],
  exports: [AgricultureRetrievalFacade],
})
export class AgricultureModule {}
