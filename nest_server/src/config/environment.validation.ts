import Joi from 'joi';

const corsOrigins = Joi.string()
  .required()
  .custom((value: string, helpers) => {
    const origins = value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    if (origins.length === 0 || origins.includes('*')) {
      return helpers.error('any.invalid');
    }

    const allOriginsAreValid = origins.every((origin) => {
      try {
        const url = new URL(origin);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    });

    return allOriginsAreValid ? value : helpers.error('any.invalid');
  }, 'CORS origin validation');

export const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('15m'),
  JWT_REFRESH_TTL: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('30d'),
  LLM_API_KEY: Joi.string().allow('').default(''),
  LLM_BASE_URL: Joi.string().uri().allow('').default(''),
  LLM_MODEL: Joi.string().allow('').default(''),
  AGRICULTURE_ANALYSIS_ENABLED: Joi.boolean().default(true),
  AGRICULTURE_ANALYSIS_DAILY_LIMIT: Joi.number().integer().min(1).max(100).default(10),
  AGRICULTURE_KNOWLEDGE_LIMIT: Joi.number().integer().min(0).max(20).default(8),
  LLM_TIMEOUT_MS: Joi.number().integer().min(1000).max(120000).default(30000),
  LLM_MAX_RETRIES: Joi.number().integer().min(0).max(1).default(1),
  CORS_ORIGINS: corsOrigins,
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
}).custom((environment: Record<string, unknown>, helpers) => {
  if (environment.JWT_ACCESS_SECRET === environment.JWT_REFRESH_SECRET) {
    return helpers.message({ custom: 'JWT_ACCESS_SECRET must differ from JWT_REFRESH_SECRET' });
  }

  return environment;
});
