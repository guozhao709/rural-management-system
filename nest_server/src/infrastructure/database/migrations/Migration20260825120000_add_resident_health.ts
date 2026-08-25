import { Migration } from '@mikro-orm/migrations';

/** M09 is intentionally independent from prior M08 migrations. */
export class Migration20260825120000_add_resident_health extends Migration {
  override name = 'Migration20260825120000_add_resident_health';
  override up(): void {
    this.addSql(
      'create table "health_consents" ("id" bigserial primary key, "user_id" int not null, "notice_version" varchar(100) not null, "scopes" jsonb not null, "granted_at" timestamptz not null, "revoked_at" timestamptz null, constraint "health_consents_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade);',
    );
    this.addSql(
      'create unique index "uq_health_consents_one_active" on "health_consents" ("user_id") where "revoked_at" is null;',
    );
    this.addSql(
      'create table "health_profiles" ("user_id" int primary key, "medical_history_ciphertext" jsonb null, "allergies_ciphertext" jsonb null, "special_population_ciphertext" jsonb null, "key_version" varchar(100) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "health_profiles_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade);',
    );
    this.addSql(
      'create table "health_measurements" ("id" bigserial primary key, "user_id" int not null, "type" varchar(32) not null, "values" jsonb not null, "measured_at" timestamptz not null, "source" varchar(32) not null, "schema_version" varchar(20) not null, "created_at" timestamptz not null, "deleted_at" timestamptz null, constraint "health_measurements_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade);',
    );
    this.addSql(
      'create index "idx_health_measurements_user_type_measured_at" on "health_measurements" ("user_id", "type", "measured_at" desc);',
    );
    this.addSql(
      'create table "health_knowledge_articles" ("id" bigserial primary key, "topic" varchar(100) not null, "current_published_version_id" bigint null, "created_at" timestamptz not null);',
    );
    this.addSql(
      'create table "health_knowledge_versions" ("id" bigserial primary key, "article_id" bigint not null, "version" int not null, "title" varchar(300) not null, "body" text not null, "source_name" varchar(300) not null, "source_url" varchar(2000) not null, "content_hash" varchar(64) not null unique, "status" varchar(20) not null, "reviewer_id" int null, "reviewed_at" timestamptz null, "review_due_at" timestamptz null, "published_at" timestamptz null, constraint "health_knowledge_versions_article_id_foreign" foreign key ("article_id") references "health_knowledge_articles" ("id") on delete cascade, constraint "uq_health_knowledge_versions_article_version" unique ("article_id", "version"));',
    );
  }
  override down(): void {
    this.addSql(
      'drop table if exists "health_knowledge_versions"; drop table if exists "health_knowledge_articles"; drop table if exists "health_measurements"; drop table if exists "health_profiles"; drop table if exists "health_consents";',
    );
  }
}
