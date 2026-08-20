import 'reflect-metadata';
import { Logger as NestLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApplication } from './app.setup';

const bootstrapLogger = new NestLogger('Bootstrap');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  configureApplication(app);

  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('app.port');

  await app.listen(port);
  bootstrapLogger.log(`智乡云 V2 后端已启动: http://localhost:${port}`);
}

void bootstrap().catch((error: unknown) => {
  const details = error instanceof Error ? (error.stack ?? error.message) : String(error);

  bootstrapLogger.error('应用启动失败', details);
  process.stderr.write(`[Bootstrap] 应用启动失败\n${details}\n`);
  process.exitCode = 1;
});
