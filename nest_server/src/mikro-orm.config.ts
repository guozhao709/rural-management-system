import 'dotenv/config';
import { createMikroOrmOptions } from './infrastructure/database/mikro-orm.options';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for the MikroORM CLI.');
}

export default createMikroOrmOptions({ databaseUrl });
