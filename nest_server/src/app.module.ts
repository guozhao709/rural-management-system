import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { LoggerModule } from './common/logger/logger.module';
import {
  agricultureConfig,
  aiConfig,
  appConfig,
  authConfig,
  databaseConfig,
  residentHealthConfig,
} from './config/configuration';
import { environmentValidationSchema } from './config/environment.validation';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminsModule } from './modules/admins/admins.module';
import { UsersModule } from './modules/users/users.module';
import { ResidentHealthModule } from './modules/resident-health/resident-health.module';
import { AgricultureModule } from './modules/agriculture/agriculture.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: false,
      load: [
        appConfig,
        databaseConfig,
        authConfig,
        aiConfig,
        residentHealthConfig,
        agricultureConfig,
      ],
      validationSchema: environmentValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    LoggerModule,
    DatabaseModule.forRoot(),
    HealthModule,
    AuthModule,
    AdminsModule,
    UsersModule,
    ResidentHealthModule,
    AgricultureModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
  ],
})
export class AppModule {}
