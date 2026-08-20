import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { DatabaseHealthIndicator } from './database-health.indicator';
import { DATABASE_HEALTH } from './database-health.port';
import { createMikroOrmOptions } from './mikro-orm.options';

@Global()
@Module({})
export class RuntimeDatabaseModule {
  static forRoot(): DynamicModule {
    const mikroOrmModule = MikroOrmModule.forRootAsync({
      driver: PostgreSqlDriver,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createMikroOrmOptions({
          databaseUrl: configService.getOrThrow<string>('database.url'),
        }),
    });

    return {
      module: RuntimeDatabaseModule,
      imports: [mikroOrmModule],
      providers: [
        DatabaseHealthIndicator,
        {
          provide: DATABASE_HEALTH,
          useExisting: DatabaseHealthIndicator,
        },
      ],
      exports: [DATABASE_HEALTH],
    };
  }
}
