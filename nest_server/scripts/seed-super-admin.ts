import 'dotenv/config';
import { MikroORM } from '@mikro-orm/core';
import config from '../src/mikro-orm.config';
import { AccountStatus } from '../src/common/enums/account-status.enum';
import { Admin, AdminRole } from '../src/modules/admins/admin.entity';
import { PasswordService } from '../src/modules/auth/services/password.service';

const username = process.env.BOOTSTRAP_ADMIN_USERNAME?.trim();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

if (!username || username.length > 50) {
  throw new Error('BOOTSTRAP_ADMIN_USERNAME is required and must not exceed 50 characters.');
}
if (!password || password.length < 8 || password.length > 128) {
  throw new Error('BOOTSTRAP_ADMIN_PASSWORD must contain 8 to 128 characters.');
}

const main = async (): Promise<void> => {
  const orm = await MikroORM.init(config);

  try {
    const entityManager = orm.em.fork();
    const admins = entityManager.getRepository(Admin);
    const existingSuperAdmin = await admins.findOne({
      role: AdminRole.SuperAdmin,
      deletedAt: null,
    });

    if (existingSuperAdmin) {
      process.stdout.write('A super_admin already exists; no account was created.\n');
    } else {
      const usernameConflict = await admins.findOne({ username });
      if (usernameConflict) {
        throw new Error('BOOTSTRAP_ADMIN_USERNAME is already in use.');
      }

      admins.create(
        {
          username,
          passwordHash: await new PasswordService().hash(password),
          role: AdminRole.SuperAdmin,
          status: AccountStatus.Active,
        },
        { partial: true },
      );
      await entityManager.flush();
      process.stdout.write('The initial super_admin was created successfully.\n');
    }
  } finally {
    await orm.close(true);
  }
};

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown seed failure';
  process.stderr.write(`Failed to seed super_admin: ${message}\n`);
  process.exitCode = 1;
});
