import { Migration } from '@mikro-orm/migrations';

export class Migration20260820113053_add_authentication_fields extends Migration {
  override name = 'Migration20260820113053_add_authentication_fields';

  override up(): void | Promise<void> {
    this.addSql(
      `alter table "admins" add "refresh_token_hash" varchar(64) null, add "refresh_token_expires_at" timestamptz null, add "last_login_at" timestamptz null;`,
    );

    this.addSql(
      `alter table "users" add "refresh_token_hash" varchar(64) null, add "refresh_token_expires_at" timestamptz null, add "last_login_at" timestamptz null;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "admins" drop column "refresh_token_hash", drop column "refresh_token_expires_at", drop column "last_login_at";`,
    );

    this.addSql(
      `alter table "users" drop column "refresh_token_hash", drop column "refresh_token_expires_at", drop column "last_login_at";`,
    );
  }
}
