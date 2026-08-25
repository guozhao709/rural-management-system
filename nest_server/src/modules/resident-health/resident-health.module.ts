import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SAFETY_TRIAGE_PORT } from './resident-health.types';
import { UnavailableSafetyTriageAdapter } from './safety-triage';
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

@Module({
  imports: [
    MikroOrmModule.forFeature([
      HealthConsent,
      HealthProfile,
      HealthMeasurement,
      HealthKnowledgeArticle,
      HealthKnowledgeVersion,
    ]),
  ],
  controllers: [ResidentHealthController, AdminHealthKnowledgeController],
  providers: [
    ResidentHealthService,
    HealthKnowledgeService,
    { provide: SAFETY_TRIAGE_PORT, useClass: UnavailableSafetyTriageAdapter },
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
  exports: [SAFETY_TRIAGE_PORT, HEALTH_SENSITIVE_DATA_CRYPTO_PORT, ResidentHealthService],
})
export class ResidentHealthModule {}
