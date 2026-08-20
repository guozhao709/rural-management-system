import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

export const configureApplication = (app: INestApplication): void => {
  const configService = app.get(ConfigService);
  const nodeEnv = configService.getOrThrow<string>('app.nodeEnv');
  const corsOrigins = configService.getOrThrow<string[]>('app.corsOrigins');

  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
    }),
  );
  app.use(cookieParser());
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false,
    }),
  );

  if (configService.getOrThrow<boolean>('app.swaggerEnabled')) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('智乡云 V2 API')
      .setDescription('智乡云 V2 后端 API 文档')
      .setVersion('0.1.0')
      .addBearerAuth()
      .addCookieAuth('zhixiangyun_user_refresh', undefined, 'zhixiangyun_user_refresh')
      .addCookieAuth('zhixiangyun_admin_refresh', undefined, 'zhixiangyun_admin_refresh')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('api/docs', app, document);
  }

  app.enableShutdownHooks();
};
