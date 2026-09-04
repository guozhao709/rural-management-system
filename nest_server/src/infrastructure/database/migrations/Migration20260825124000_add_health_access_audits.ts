import { Migration } from '@mikro-orm/migrations';

export class Migration20260825124000_add_health_access_audits extends Migration {
  override name = 'Migration20260825124000_add_health_access_audits';
  override up(): void {
    this.addSql('create table "health_access_audits" ("id" bigserial primary key, "actor_type" varchar(20) not null, "actor_id" varchar(64) not null, "action" varchar(64) not null, "resource_type" varchar(64) not null, "resource_id" varchar(128) not null, "purpose" varchar(128) not null, "request_id" varchar(128) null, "outcome" varchar(20) not null, "created_at" timestamptz not null);');
    this.addSql('create index "idx_health_access_audits_actor_created_at" on "health_access_audits" ("actor_id", "created_at" desc);');
  }
  override down(): void { this.addSql('drop table if exists "health_access_audits";'); }
}
