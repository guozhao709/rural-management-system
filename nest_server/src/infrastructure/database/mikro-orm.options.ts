import path from 'node:path';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';
import { Admin } from '../../modules/admins/admin.entity';
import { AgricultureKnowledge } from '../../modules/agriculture/entities/agriculture-knowledge.entity';
import { CropAlias } from '../../modules/agriculture/entities/crop-alias.entity';
import { CropAnalysisKnowledgeRef } from '../../modules/agriculture/entities/crop-analysis-knowledge-ref.entity';
import { CropAnalysis } from '../../modules/agriculture/entities/crop-analysis.entity';
import { Crop } from '../../modules/agriculture/entities/crop.entity';
import { HealthAccessAudit } from '../../modules/resident-health/entities/health-access-audit.entity';
import { HealthAssessment } from '../../modules/resident-health/entities/health-assessment.entity';
import { HealthConsent } from '../../modules/resident-health/entities/health-consent.entity';
import { HealthKnowledgeArticle } from '../../modules/resident-health/entities/health-knowledge-article.entity';
import { HealthKnowledgeVersion } from '../../modules/resident-health/entities/health-knowledge-version.entity';
import { HealthMeasurement } from '../../modules/resident-health/entities/health-measurement.entity';
import { HealthProfile } from '../../modules/resident-health/entities/health-profile.entity';
import { User } from '../../modules/users/user.entity';

export interface MikroOrmOptionsInput {
  databaseUrl: string;
}

const fromProjectRoot = (...segments: string[]): string =>
  path.join(process.cwd(), ...segments).replaceAll('\\', '/');

const entities = [
  Admin,
  User,
  Crop,
  CropAlias,
  AgricultureKnowledge,
  CropAnalysis,
  CropAnalysisKnowledgeRef,
  HealthConsent,
  HealthProfile,
  HealthMeasurement,
  HealthKnowledgeArticle,
  HealthKnowledgeVersion,
  HealthAssessment,
  HealthAccessAudit,
];

export const createMikroOrmOptions = ({ databaseUrl }: MikroOrmOptionsInput) =>
  defineConfig({
    clientUrl: databaseUrl,
    entities,
    discovery: {
      warnWhenNoEntities: false,
    },
    extensions: [Migrator],
    migrations: {
      tableName: 'mikro_orm_migrations',
      path: fromProjectRoot('dist', 'infrastructure', 'database', 'migrations'),
      pathTs: fromProjectRoot('src', 'infrastructure', 'database', 'migrations'),
      glob: '!(*.d).{js,ts,cjs}',
      emit: 'ts',
      transactional: true,
      allOrNothing: true,
      dropTables: false,
      snapshot: true,
    },
    schemaGenerator: {
      disableForeignKeys: false,
      createForeignKeyConstraints: true,
    },
    pool: {
      min: 1,
      max: 10,
    },
    debug: false,
  });
