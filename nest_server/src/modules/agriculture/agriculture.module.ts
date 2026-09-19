import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AgricultureV2Controller } from './controllers/agriculture-v2.controller';
import { Crop } from './entities/crop.entity';
import { CropAlias } from './entities/crop-alias.entity';
import { AgricultureKnowledge } from './entities/agriculture-knowledge.entity';
import { AgricultureGrowthAnalysis, AgricultureGrowthMetric, AgricultureGrowthMetricRecord, AgricultureLand, AgriculturePlanting, AgriculturePlantingEvaluation } from './entities/agriculture-v2.entity';
import { AGRICULTURE_V2_LLM_PORT } from './ports/agriculture-v2-llm.port';
import { AGRICULTURE_V2_WEATHER_PORT } from './ports/agriculture-v2-weather.port';
import { AgricultureV2LlmAdapter } from './adapters/agriculture-v2-llm.adapter';
import { AgricultureV2UnavailableWeatherAdapter } from './adapters/agriculture-v2-unavailable-weather.adapter';
import { AgricultureV2AnalysisService } from './services/agriculture-v2-analysis.service';
import { AgricultureV2Service } from './services/agriculture-v2.service';
@Module({
  imports: [
    MikroOrmModule.forFeature([
      Crop,
      CropAlias,
      AgricultureKnowledge,
      AgricultureLand,
      AgriculturePlanting,
      AgricultureGrowthMetric,
      AgricultureGrowthMetricRecord,
      AgriculturePlantingEvaluation,
      AgricultureGrowthAnalysis,
    ]),
  ],
  controllers: [AgricultureV2Controller],
  providers: [
    AgricultureV2Service,
    AgricultureV2AnalysisService,
    AgricultureV2LlmAdapter,
    AgricultureV2UnavailableWeatherAdapter,
    { provide: AGRICULTURE_V2_LLM_PORT, useExisting: AgricultureV2LlmAdapter },
    { provide: AGRICULTURE_V2_WEATHER_PORT, useExisting: AgricultureV2UnavailableWeatherAdapter },
  ],
  exports: [AgricultureV2Service],
})
export class AgricultureModule {}
