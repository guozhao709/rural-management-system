import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SAFETY_TRIAGE_PORT } from './resident-health.types';
import { UnavailableSafetyTriageAdapter } from './safety-triage';
import { DevelopmentReferenceTriageAdapter } from './development-reference-triage.adapter';
import { HEALTH_SENSITIVE_DATA_CRYPTO_PORT } from './health-sensitive-data-crypto';
import { AesGcmHealthSensitiveDataCryptoAdapter } from './health-sensitive-data-crypto';
import { HealthConsent } from './entities/health-consent.entity';
import { HealthProfile } from './entities/health-profile.entity';
import { HealthMeasurement } from './entities/health-measurement.entity';
import { HealthKnowledgeArticle } from './entities/health-knowledge-article.entity';
import { HealthKnowledgeVersion } from './entities/health-knowledge-version.entity';
import { ResidentHealthController } from './resident-health.controller';
import { ResidentHealthService } from './resident-health.service';
import { HealthKnowledgeService } from './health-knowledge.service';
import { AdminHealthKnowledgeController } from './admin-health-knowledge.controller';
import { ResidentHealthRetrievalFacade } from './resident-health-retrieval.facade';
import { HealthAssessment } from './entities/health-assessment.entity';
import { HealthAssessmentService } from './health-assessment.service';
import { HealthAccessAudit } from './entities/health-access-audit.entity';
import { HealthAccessAuditService } from './health-access-audit.service';
import { HEALTH_EXPLANATION_LLM_PORT, OpenAiCompatibleHealthExplanationAdapter, UnavailableHealthExplanationAdapter } from './health-explanation.port';
import { HealthDataLifecycleService } from './health-data-lifecycle.service';

export const createSafetyTriageAdapter = (assessmentEnabled: boolean, nodeEnv: string) =>
  assessmentEnabled && nodeEnv !== 'production'
    ? new DevelopmentReferenceTriageAdapter()
    : new UnavailableSafetyTriageAdapter();

@Module({
  imports: [
    MikroOrmModule.forFeature([
      HealthConsent,
      HealthProfile,
      HealthMeasurement,
      HealthKnowledgeArticle,
      HealthKnowledgeVersion,
      HealthAssessment,
      HealthAccessAudit,
    ]),
  ],
  controllers: [ResidentHealthController, AdminHealthKnowledgeController],
  providers: [
    ResidentHealthService,
    HealthKnowledgeService,
    ResidentHealthRetrievalFacade,
    HealthAssessmentService,
    HealthAccessAuditService,
    HealthDataLifecycleService,
    {
      provide: HEALTH_EXPLANATION_LLM_PORT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<boolean>('residentHealth.aiExplanationEnabled')
          ? new OpenAiCompatibleHealthExplanationAdapter(config)
          : new UnavailableHealthExplanationAdapter(),
    },
    {
      provide: 'HEALTH_ASSESSMENT_RUNTIME_CONFIG',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        assessmentDailyLimit: config.get<number>('residentHealth.assessmentDailyLimit') ?? 5,
        aiExplanationEnabled: config.get<boolean>('residentHealth.aiExplanationEnabled') ?? false,
      }),
    },
    {
      provide: SAFETY_TRIAGE_PORT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createSafetyTriageAdapter(
          config.get<boolean>('residentHealth.assessmentEnabled') ?? false,
          config.get<string>('app.nodeEnv') ?? 'development',
        ),
    },
    {
      provide: HEALTH_SENSITIVE_DATA_CRYPTO_PORT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const encodedKey = config.get<string>('residentHealth.encryptionKey') ?? '';
        if (!encodedKey) return null;
        return new AesGcmHealthSensitiveDataCryptoAdapter(
          Buffer.from(encodedKey, 'base64'),
          config.get<string>('residentHealth.rulesetVersion') || 'unversioned',
        );
      },
    },
  ],
  exports: [
    SAFETY_TRIAGE_PORT,
    HEALTH_SENSITIVE_DATA_CRYPTO_PORT,
    ResidentHealthService,
    ResidentHealthRetrievalFacade,
    HealthDataLifecycleService,
  ],
})
export class ResidentHealthModule {}
