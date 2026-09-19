import path from 'node:path';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';
import { Admin } from '../../modules/admins/admin.entity';
import { AgricultureKnowledge } from '../../modules/agriculture/entities/agriculture-knowledge.entity';
import { CropAlias } from '../../modules/agriculture/entities/crop-alias.entity';
import { CropAnalysisKnowledgeRef } from '../../modules/agriculture/entities/crop-analysis-knowledge-ref.entity';
import { CropAnalysis } from '../../modules/agriculture/entities/crop-analysis.entity';
import { Crop } from '../../modules/agriculture/entities/crop.entity';
import {
  AgricultureGrowthAnalysis,
  AgricultureGrowthMetric,
  AgricultureGrowthMetricRecord,
  AgricultureLand,
  AgriculturePlanting,
  AgriculturePlantingEvaluation,
} from '../../modules/agriculture/entities/agriculture-v2.entity';
import { User } from '../../modules/users/user.entity';
import { HealthProfile } from '../../modules/health/entities/health-profile.entity';
import { HealthMetricTemplate } from '../../modules/health/entities/health-metric-template.entity';
import { HealthMetricRecord } from '../../modules/health/entities/health-metric-record.entity';
import { HealthAnalysis } from '../../modules/health/entities/health-analysis.entity';
import { HealthKnowledge } from '../../modules/health/entities/health-knowledge.entity';

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
  AgricultureLand,
  AgriculturePlanting,
  AgricultureGrowthMetric,
  AgricultureGrowthMetricRecord,
  AgriculturePlantingEvaluation,
  AgricultureGrowthAnalysis,
  HealthProfile,
  HealthMetricTemplate,
  HealthMetricRecord,
  HealthAnalysis,
  HealthKnowledge,
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
