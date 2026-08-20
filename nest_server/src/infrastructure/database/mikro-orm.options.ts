import path from 'node:path';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';

export interface MikroOrmOptionsInput {
  databaseUrl: string;
}

const fromProjectRoot = (...segments: string[]): string =>
  path.join(process.cwd(), ...segments).replaceAll('\\', '/');

export const createMikroOrmOptions = ({ databaseUrl }: MikroOrmOptionsInput) =>
  defineConfig({
    clientUrl: databaseUrl,
    entities: [fromProjectRoot('dist', '**', '*.entity.js')],
    entitiesTs: [fromProjectRoot('src', '**', '*.entity.ts')],
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
