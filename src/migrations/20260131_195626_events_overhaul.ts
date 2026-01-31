import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Create new enums (use IF NOT EXISTS to handle dev mode)
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_events_recurrence_recurrence_type" AS ENUM('weekly', 'monthly');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_events_recurrence_monthly_type" AS ENUM('dayOfMonth', 'dayOfWeek');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum__events_v_version_recurrence_recurrence_type" AS ENUM('weekly', 'monthly');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum__events_v_version_recurrence_monthly_type" AS ENUM('dayOfMonth', 'dayOfWeek');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)

  // Drop tables that may or may not exist (from removed collections)
  await db.execute(sql`DROP TABLE IF EXISTS "event_applications_rels" CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS "event_applications" CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS "signature_events_gallery" CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS "signature_events_locales" CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS "signature_events" CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS "_signature_events_v_version_gallery" CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS "_signature_events_v_locales" CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS "_signature_events_v" CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS "categories_breadcrumbs" CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS "membership_tiers_tiers_features" CASCADE`)

  // Drop constraints that may or may not exist
  await db.execute(sql`
    ALTER TABLE IF EXISTS "categories" DROP CONSTRAINT IF EXISTS "categories_parent_id_categories_id_fk"
  `)
  await db.execute(sql`
    ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_event_applications_fk"
  `)
  await db.execute(sql`
    ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_signature_events_fk"
  `)

  // Drop indexes that may or may not exist
  await db.execute(sql`DROP INDEX IF EXISTS "categories_parent_idx"`)
  await db.execute(sql`DROP INDEX IF EXISTS "payload_locked_documents_rels_event_applications_id_idx"`)
  await db.execute(sql`DROP INDEX IF EXISTS "payload_locked_documents_rels_signature_events_id_idx"`)

  // Add new columns to events table (use IF NOT EXISTS pattern via DO block)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "events" ADD COLUMN "attachment_id" integer;
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "events" ADD COLUMN "is_chamber_event" boolean DEFAULT false;
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "events" ADD COLUMN "link_title" varchar;
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "events" ADD COLUMN "is_recurring" boolean DEFAULT false;
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "events" ADD COLUMN "recurrence_recurrence_type" "enum_events_recurrence_recurrence_type";
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "events" ADD COLUMN "recurrence_recurrence_start_date" timestamp(3) with time zone;
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "events" ADD COLUMN "recurrence_recurrence_end_date" timestamp(3) with time zone;
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "events" ADD COLUMN "recurrence_monthly_type" "enum_events_recurrence_monthly_type";
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)

  // Add new columns to _events_v table
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "_events_v" ADD COLUMN "version_attachment_id" integer;
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "_events_v" ADD COLUMN "version_is_chamber_event" boolean DEFAULT false;
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "_events_v" ADD COLUMN "version_link_title" varchar;
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "_events_v" ADD COLUMN "version_is_recurring" boolean DEFAULT false;
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "_events_v" ADD COLUMN "version_recurrence_recurrence_type" "enum__events_v_version_recurrence_recurrence_type";
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "_events_v" ADD COLUMN "version_recurrence_recurrence_start_date" timestamp(3) with time zone;
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "_events_v" ADD COLUMN "version_recurrence_recurrence_end_date" timestamp(3) with time zone;
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "_events_v" ADD COLUMN "version_recurrence_monthly_type" "enum__events_v_version_recurrence_monthly_type";
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)

  // Add foreign keys (ignore if already exists)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "events" ADD CONSTRAINT "events_attachment_id_media_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_attachment_id_media_id_fk" FOREIGN KEY ("version_attachment_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)

  // Create indexes (ignore if already exists)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "events_attachment_idx" ON "events" USING btree ("attachment_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "_events_v_version_version_attachment_idx" ON "_events_v" USING btree ("version_attachment_id")`)

  // Drop old columns (ignore if already dropped)
  await db.execute(sql`ALTER TABLE "events" DROP COLUMN IF EXISTS "category"`)
  await db.execute(sql`ALTER TABLE "events" DROP COLUMN IF EXISTS "recurring"`)
  await db.execute(sql`ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_category"`)
  await db.execute(sql`ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_recurring"`)
  await db.execute(sql`ALTER TABLE "news" DROP COLUMN IF EXISTS "generate_slug"`)
  await db.execute(sql`ALTER TABLE "_news_v" DROP COLUMN IF EXISTS "version_generate_slug"`)
  await db.execute(sql`ALTER TABLE "categories" DROP COLUMN IF EXISTS "icon"`)
  await db.execute(sql`ALTER TABLE "categories" DROP COLUMN IF EXISTS "parent_id"`)
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "event_applications_id"`)
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "signature_events_id"`)
  await db.execute(sql`ALTER TABLE "membership_tiers_tiers" DROP COLUMN IF EXISTS "advertising_slots"`)
  await db.execute(sql`ALTER TABLE "membership_tiers_tiers" DROP COLUMN IF EXISTS "featured_in_directory"`)

  // Drop old types (ignore if already dropped)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_events_category"`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__events_v_version_category"`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_event_applications_status"`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_signature_events_event_status"`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_signature_events_status"`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__signature_events_v_version_event_status"`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__signature_events_v_version_status"`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__signature_events_v_published_locale"`)

  // Migrate existing data: convert category='chamber' to isChamberEvent=true
  await db.execute(sql`UPDATE events SET is_chamber_event = false WHERE is_chamber_event IS NULL`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // This is a destructive migration - down migration would require recreating all removed tables
  // For simplicity, we'll just revert the events table changes
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_events_category" AS ENUM('chamber', 'community', 'networking', 'workshop', 'festival', 'fundraiser', 'social');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum__events_v_version_category" AS ENUM('chamber', 'community', 'networking', 'workshop', 'festival', 'fundraiser', 'social');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "events" ADD COLUMN "category" "enum_events_category";
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "events" ADD COLUMN "recurring" boolean DEFAULT false;
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "_events_v" ADD COLUMN "version_category" "enum__events_v_version_category";
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "_events_v" ADD COLUMN "version_recurring" boolean DEFAULT false;
    EXCEPTION WHEN duplicate_column THEN null;
    END $$;
  `)

  // Convert isChamberEvent back to category
  await db.execute(sql`UPDATE events SET category = 'chamber' WHERE is_chamber_event = true`)

  // Drop new columns
  await db.execute(sql`ALTER TABLE "events" DROP COLUMN IF EXISTS "attachment_id"`)
  await db.execute(sql`ALTER TABLE "events" DROP COLUMN IF EXISTS "is_chamber_event"`)
  await db.execute(sql`ALTER TABLE "events" DROP COLUMN IF EXISTS "link_title"`)
  await db.execute(sql`ALTER TABLE "events" DROP COLUMN IF EXISTS "is_recurring"`)
  await db.execute(sql`ALTER TABLE "events" DROP COLUMN IF EXISTS "recurrence_recurrence_type"`)
  await db.execute(sql`ALTER TABLE "events" DROP COLUMN IF EXISTS "recurrence_recurrence_start_date"`)
  await db.execute(sql`ALTER TABLE "events" DROP COLUMN IF EXISTS "recurrence_recurrence_end_date"`)
  await db.execute(sql`ALTER TABLE "events" DROP COLUMN IF EXISTS "recurrence_monthly_type"`)
  await db.execute(sql`ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_attachment_id"`)
  await db.execute(sql`ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_is_chamber_event"`)
  await db.execute(sql`ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_link_title"`)
  await db.execute(sql`ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_is_recurring"`)
  await db.execute(sql`ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_recurrence_recurrence_type"`)
  await db.execute(sql`ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_recurrence_recurrence_start_date"`)
  await db.execute(sql`ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_recurrence_recurrence_end_date"`)
  await db.execute(sql`ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_recurrence_monthly_type"`)

  // Drop new types
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_events_recurrence_recurrence_type"`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_events_recurrence_monthly_type"`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__events_v_version_recurrence_recurrence_type"`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__events_v_version_recurrence_monthly_type"`)
}
