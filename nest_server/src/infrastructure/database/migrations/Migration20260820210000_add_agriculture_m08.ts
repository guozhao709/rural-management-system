import { Migration } from '@mikro-orm/migrations';
export class Migration20260820210000_add_agriculture_m08 extends Migration {
  override name = 'Migration20260820210000_add_agriculture_m08';
  override up(): void {
    this.addSql(
      `create table "agriculture_crops" ("id" serial primary key, "code" varchar(64) not null unique, "name" varchar(100) not null unique, "scientific_name" varchar(150) null, "status" varchar(16) not null default 'active', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now());`,
    );
    this.addSql(
      `create table "agriculture_crop_aliases" ("id" serial primary key, "crop_id" int not null, "alias" varchar(100) not null, "normalized_alias" varchar(100) not null unique, constraint "agriculture_crop_aliases_crop_id_foreign" foreign key ("crop_id") references "agriculture_crops" ("id") on delete restrict); create index "agriculture_crop_aliases_crop_id_index" on "agriculture_crop_aliases" ("crop_id");`,
    );
    this.addSql(
      `create table "agriculture_knowledge" ("id" serial primary key,"title" varchar(255) not null,"summary" varchar(500) null,"content" text not null,"category" varchar(32) not null,"tags" text[] not null default '{}',"region_codes" text[] not null default '{}',"is_general" boolean not null default false,"source_name" varchar(255) null,"source_url" varchar(1000) null,"valid_until" date null,"status" varchar(16) not null default 'draft',"version" int not null default 1,"content_hash" varchar(64) not null,"created_by" int not null,"updated_by" int not null,"published_by" int null,"published_at" timestamptz null,"created_at" timestamptz not null default now(),"updated_at" timestamptz not null default now(),"deleted_at" timestamptz null, foreign key ("created_by") references "admins" ("id"), foreign key ("updated_by") references "admins" ("id"), foreign key ("published_by") references "admins" ("id")); create index "agriculture_knowledge_published_at_index" on "agriculture_knowledge" ("status","published_at");`,
    );
    this.addSql(
      `create table "agriculture_knowledge_crops" ("agriculture_knowledge_id" int not null,"crop_id" int not null, primary key ("agriculture_knowledge_id","crop_id"), foreign key ("agriculture_knowledge_id") references "agriculture_knowledge" ("id") on delete cascade, foreign key ("crop_id") references "agriculture_crops" ("id") on delete restrict);`,
    );
    this.addSql(
      `create table "crop_analyses" ("id" bigserial primary key,"user_id" int not null,"crop_id" int not null,"crop_name_snapshot" varchar(100) not null,"region_code" varchar(32) not null,"region_name" varchar(255) not null,"status" varchar(16) not null default 'processing',"input_snapshot" jsonb not null,"context_snapshot" jsonb not null,"result" jsonb null,"schema_version" varchar(16) not null default '1.0',"prompt_version" varchar(32) not null default 'm08-v1',"model_provider" varchar(64) null,"model_name" varchar(128) null,"duration_ms" int null,"error_code" varchar(64) null,"error_message" varchar(255) null,"created_at" timestamptz not null default now(),"completed_at" timestamptz null, foreign key ("user_id") references "users" ("id") on delete restrict, foreign key ("crop_id") references "agriculture_crops" ("id") on delete restrict); create index "crop_analyses_user_id_created_at_index" on "crop_analyses" ("user_id","created_at" desc); create index "crop_analyses_status_created_at_index" on "crop_analyses" ("status","created_at");`,
    );
    this.addSql(
      `create table "crop_analysis_knowledge_refs" ("id" serial primary key,"analysis_id" bigint not null,"knowledge_id" int not null,"knowledge_version" int not null,"title_snapshot" varchar(255) not null,"score" real not null default 1, foreign key ("analysis_id") references "crop_analyses" ("id") on delete cascade, foreign key ("knowledge_id") references "agriculture_knowledge" ("id") on delete restrict, unique ("analysis_id","knowledge_id","knowledge_version"));`,
    );
  }
  override down(): void {
    this.addSql(
      'drop table if exists "crop_analysis_knowledge_refs"; drop table if exists "crop_analyses"; drop table if exists "agriculture_knowledge_crops"; drop table if exists "agriculture_knowledge"; drop table if exists "agriculture_crop_aliases"; drop table if exists "agriculture_crops";',
    );
  }
}
