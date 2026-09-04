import { Migration } from '@mikro-orm/migrations';
export class Migration20260825123000_add_health_assessments extends Migration {
  override name = 'Migration20260825123000_add_health_assessments';
  override up(): void {
    this.addSql('create table "health_assessments" ("id" uuid primary key, "user_id" int not null, "consent_id" bigint not null, "idempotency_key" varchar(128) not null, "status" varchar(20) not null, "triage_level" varchar(20) not null, "input_snapshot_ciphertext" jsonb not null, "rule_result" jsonb not null, "result" jsonb null, "rule_version" varchar(100) not null, "schema_version" varchar(20) not null, "prompt_version" varchar(50) null, "error_code" varchar(100) null, "created_at" timestamptz not null, "completed_at" timestamptz null, "deleted_at" timestamptz null, constraint "health_assessments_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade, constraint "health_assessments_consent_id_foreign" foreign key ("consent_id") references "health_consents" ("id"));');
    this.addSql('create unique index "uq_health_assessments_user_idempotency" on "health_assessments" ("user_id", "idempotency_key"); create index "idx_health_assessments_user_created_at" on "health_assessments" ("user_id", "created_at" desc);');
  }
  override down(): void { this.addSql('drop table if exists "health_assessments";'); }
}
