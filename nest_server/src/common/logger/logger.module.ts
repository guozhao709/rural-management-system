import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.getOrThrow<string>('app.nodeEnv');

        return {
          pinoHttp: {
            level: configService.getOrThrow<string>('app.logLevel'),
            timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
            genReqId: (request, response) => {
              const incomingId = request.headers['x-request-id'];
              const requestId =
                typeof incomingId === 'string' && incomingId.trim() ? incomingId : randomUUID();

              response.setHeader('x-request-id', requestId);
              return requestId;
            },
            customProps: (request) => ({
              requestId: request.id,
            }),
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
                'req.body.passwordHash',
                'req.body.password_hash',
                'req.body.token',
                'req.body.jwt',
                'req.body.accessToken',
                'req.body.refreshToken',
                'req.body.refresh_token',
                'req.body.refreshTokenHash',
                'req.body.refresh_token_hash',
                'req.body.jwtAccessSecret',
                'req.body.jwtRefreshSecret',
                'req.body.apiKey',
                'req.body.llmApiKey',
                'req.body.healthInfo',
              ],
              censor: '[REDACTED]',
            },
            transport:
              nodeEnv === 'production'
                ? undefined
                : {
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      singleLine: true,
                      translateTime: false,
                      ignore: 'pid,hostname',
                    },
                  },
          },
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
