import { Migration } from '@mikro-orm/migrations';

export class Migration20260820104222_add_admins_and_users extends Migration {
  override name = 'Migration20260820104222_add_admins_and_users';

  override up(): void | Promise<void> {
    this.addSql(
      `create table "admins" ("id" serial primary key, "username" varchar(50) not null, "password_hash" varchar(255) not null, "phone" varchar(20) null, "role" varchar(32) not null default 'admin', "status" varchar(16) not null default 'active', "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null);`,
    );
    this.addSql(
      `alter table "admins" add constraint "admins_username_unique" unique ("username");`,
    );
    this.addSql(`create index "idx_admins_created_at" on "admins" ("created_at");`);

    this.addSql(
      `create table "users" ("id" serial primary key, "phone" varchar(20) not null, "password_hash" varchar(255) not null, "name" varchar(50) not null, "gender" varchar(16) not null default 'unknown', "birthday" date null, "address" varchar(255) null, "status" varchar(16) not null default 'active', "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null);`,
    );
    this.addSql(`alter table "users" add constraint "users_phone_unique" unique ("phone");`);
    this.addSql(`create index "idx_users_created_at" on "users" ("created_at");`);
  }
}
