// Remove schema left behind when versioning/drafts were turned off for Events, and
// autosave for Businesses, Benefits and News. The code stopped using these without a
// migration, so databases built from 20260201_171749_initial still carry them:
//   - tables _events_v, _events_v_locales (old event versions; nothing reads them)
//   - events._status and its enum
//   - the autosave column on _businesses_v, _benefits_v, _news_v
//   - the _events_v enums
// IF EXISTS throughout, so it is a no-op on databases that never had them (e.g. a
// dev-pushed DB). Hand-written: migrate:create can't see this drift, because the
// latest snapshot already matches the code.
//
// DOWN recreates the structures EMPTY. The old version rows are not restorable from
// here; take a database backup before applying UP.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "_events_v_locales" CASCADE;
  DROP TABLE IF EXISTS "_events_v" CASCADE;
  ALTER TABLE "events" DROP COLUMN IF EXISTS "_status";
  ALTER TABLE "_businesses_v" DROP COLUMN IF EXISTS "autosave";
  ALTER TABLE "_benefits_v" DROP COLUMN IF EXISTS "autosave";
  ALTER TABLE "_news_v" DROP COLUMN IF EXISTS "autosave";
  DROP TYPE IF EXISTS "public"."enum_events_status";
  DROP TYPE IF EXISTS "public"."enum__events_v_version_recurrence_recurrence_type";
  DROP TYPE IF EXISTS "public"."enum__events_v_version_recurrence_monthly_type";
  DROP TYPE IF EXISTS "public"."enum__events_v_version_event_status";
  DROP TYPE IF EXISTS "public"."enum__events_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__events_v_published_locale";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__events_v_version_recurrence_recurrence_type" AS ENUM('weekly', 'monthly');
  CREATE TYPE "public"."enum__events_v_version_recurrence_monthly_type" AS ENUM('dayOfMonth', 'dayOfWeek');
  CREATE TYPE "public"."enum__events_v_version_event_status" AS ENUM('pending', 'published', 'draft', 'cancelled');
  CREATE TYPE "public"."enum__events_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__events_v_published_locale" AS ENUM('en', 'fr');
  ALTER TABLE "events" ADD COLUMN "_status" "enum_events_status" DEFAULT 'draft';
  ALTER TABLE "_businesses_v" ADD COLUMN "autosave" boolean;
  ALTER TABLE "_benefits_v" ADD COLUMN "autosave" boolean;
  ALTER TABLE "_news_v" ADD COLUMN "autosave" boolean;
  CREATE TABLE "_events_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_image_id" integer,
  	"version_attachment_id" integer,
  	"version_date" timestamp(3) with time zone,
  	"version_end_date" timestamp(3) with time zone,
  	"version_start_time" varchar,
  	"version_end_time" varchar,
  	"version_location" varchar,
  	"version_address" varchar,
  	"version_city" varchar,
  	"version_state" varchar DEFAULT 'VT',
  	"version_zip_code" varchar,
  	"version_coordinates_latitude" numeric,
  	"version_coordinates_longitude" numeric,
  	"version_business_id" integer,
  	"version_organizer" varchar,
  	"version_is_chamber_event" boolean DEFAULT false,
  	"version_external_url" varchar,
  	"version_link_title" varchar,
  	"version_is_recurring" boolean DEFAULT false,
  	"version_recurrence_recurrence_type" "enum__events_v_version_recurrence_recurrence_type",
  	"version_recurrence_monthly_type" "enum__events_v_version_recurrence_monthly_type",
  	"version_featured" boolean DEFAULT false,
  	"version_event_status" "enum__events_v_version_event_status" DEFAULT 'pending',
  	"version_submitted_by_id" integer,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__events_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__events_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  CREATE TABLE "_events_v_locales" (
  	"version_title" varchar,
  	"version_description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_attachment_id_media_id_fk" FOREIGN KEY ("version_attachment_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_business_id_businesses_id_fk" FOREIGN KEY ("version_business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_submitted_by_id_users_id_fk" FOREIGN KEY ("version_submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_locales" ADD CONSTRAINT "_events_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events__status_idx" ON "events" USING btree ("_status");
  CREATE INDEX "_businesses_v_autosave_idx" ON "_businesses_v" USING btree ("autosave");
  CREATE INDEX "_benefits_v_autosave_idx" ON "_benefits_v" USING btree ("autosave");
  CREATE INDEX "_news_v_autosave_idx" ON "_news_v" USING btree ("autosave");
  CREATE INDEX "_events_v_parent_idx" ON "_events_v" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_version_image_idx" ON "_events_v" USING btree ("version_image_id");
  CREATE INDEX "_events_v_version_version_attachment_idx" ON "_events_v" USING btree ("version_attachment_id");
  CREATE INDEX "_events_v_version_version_business_idx" ON "_events_v" USING btree ("version_business_id");
  CREATE INDEX "_events_v_version_version_submitted_by_idx" ON "_events_v" USING btree ("version_submitted_by_id");
  CREATE INDEX "_events_v_version_version_slug_idx" ON "_events_v" USING btree ("version_slug");
  CREATE INDEX "_events_v_version_version_updated_at_idx" ON "_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_v_version_version_created_at_idx" ON "_events_v" USING btree ("version_created_at");
  CREATE INDEX "_events_v_version_version__status_idx" ON "_events_v" USING btree ("version__status");
  CREATE INDEX "_events_v_created_at_idx" ON "_events_v" USING btree ("created_at");
  CREATE INDEX "_events_v_updated_at_idx" ON "_events_v" USING btree ("updated_at");
  CREATE INDEX "_events_v_snapshot_idx" ON "_events_v" USING btree ("snapshot");
  CREATE INDEX "_events_v_published_locale_idx" ON "_events_v" USING btree ("published_locale");
  CREATE INDEX "_events_v_latest_idx" ON "_events_v" USING btree ("latest");
  CREATE INDEX "_events_v_autosave_idx" ON "_events_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_events_v_locales_locale_parent_id_unique" ON "_events_v_locales" USING btree ("_locale","_parent_id");`)
}
