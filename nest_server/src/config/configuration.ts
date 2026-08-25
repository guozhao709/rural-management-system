import { registerAs } from '@nestjs/config';

const parseCorsOrigins = (value: string | undefined): string[] =>
  (value ?? 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  swaggerEnabled: process.env.NODE_ENV !== 'production',
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

export const authConfig = registerAs('auth', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
}));

export const aiConfig = registerAs('ai', () => ({
  apiKey: process.env.LLM_API_KEY ?? '',
  baseUrl: process.env.LLM_BASE_URL ?? '',
  model: process.env.LLM_MODEL ?? '',
}));

export const residentHealthConfig = registerAs('residentHealth', () => ({
  assessmentEnabled: process.env.HEALTH_ASSESSMENT_ENABLED === 'true',
  aiExplanationEnabled: process.env.HEALTH_AI_EXPLANATION_ENABLED === 'true',
  assessmentDailyLimit: Number(process.env.HEALTH_ASSESSMENT_DAILY_LIMIT ?? 5),
  knowledgeLimit: Number(process.env.HEALTH_KNOWLEDGE_LIMIT ?? 6),
  retentionDays: Number(process.env.HEALTH_DATA_RETENTION_DAYS ?? 365),
  rulesetVersion: process.env.HEALTH_RULESET_VERSION ?? '',
  encryptionKey: process.env.HEALTH_DATA_ENCRYPTION_KEY ?? '',
  legacyRoutesEnabled: process.env.HEALTH_LEGACY_ROUTES_ENABLED === 'true',
}));
