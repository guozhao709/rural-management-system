import { DynamicModule, Global, Module } from '@nestjs/common';
import { DATABASE_HEALTH } from './database-health.port';

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule | Promise<DynamicModule> {
    if (process.env.NODE_ENV === 'test') {
      return {
        module: DatabaseModule,
        providers: [
          {
            provide: DATABASE_HEALTH,
            useValue: {
              ping: async (): Promise<void> => undefined,
            },
          },
        ],
        exports: [DATABASE_HEALTH],
      };
    }

    return import('./database.runtime.module.js').then(({ RuntimeDatabaseModule }) =>
      RuntimeDatabaseModule.forRoot(),
    );
  }
}
