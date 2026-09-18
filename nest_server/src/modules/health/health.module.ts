import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { HealthController } from './health.controller';
import { HealthKnowledge } from './entities/health-knowledge.entity';
import { HealthMetricRecord } from './entities/health-metric-record.entity';
import { HealthMetricTemplate } from './entities/health-metric-template.entity';
import { HealthProfile } from './entities/health-profile.entity';
import { HealthService } from './health.service';
import { HealthAnalysis } from './entities/health-analysis.entity';
import { HealthAnalysisService } from './health-analysis.service';
import { HEALTH_LLM_PORT } from './health-llm.port';
import { OpenAiCompatibleHealthLlmAdapter } from './openai-compatible-health-llm.adapter';

@Module({ imports: [MikroOrmModule.forFeature([HealthProfile, HealthMetricTemplate, HealthMetricRecord, HealthKnowledge, HealthAnalysis])], controllers: [HealthController], providers: [HealthService, HealthAnalysisService, OpenAiCompatibleHealthLlmAdapter, { provide: HEALTH_LLM_PORT, useExisting: OpenAiCompatibleHealthLlmAdapter }] })
export class HealthBusinessModule {}
