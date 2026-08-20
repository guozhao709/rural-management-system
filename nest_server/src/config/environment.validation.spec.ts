import { environmentValidationSchema } from './environment.validation';

describe('authentication environment validation', () => {
  const validEnvironment = {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:5433/test',
    JWT_ACCESS_SECRET: 'access-secret-with-at-least-32-characters',
    JWT_REFRESH_SECRET: 'refresh-secret-with-at-least-32-characters',
    CORS_ORIGINS: 'http://localhost:5173',
  };

  it('accepts distinct secrets and applies the documented TTL defaults', () => {
    const result = environmentValidationSchema.validate(validEnvironment);

    expect(result.error).toBeUndefined();
    expect(result.value).toMatchObject({ JWT_ACCESS_TTL: '15m', JWT_REFRESH_TTL: '30d' });
  });

  it('rejects missing or identical secrets', () => {
    expect(
      environmentValidationSchema.validate({
        ...validEnvironment,
        JWT_REFRESH_SECRET: undefined,
      }).error,
    ).toBeDefined();
    expect(
      environmentValidationSchema.validate({
        ...validEnvironment,
        JWT_REFRESH_SECRET: validEnvironment.JWT_ACCESS_SECRET,
      }).error,
    ).toBeDefined();
  });
});
