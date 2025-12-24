import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_businesses_advertising_slots_type" AS ENUM('image', 'video', 'offer');
  CREATE TYPE "public"."enum_businesses_membership_tier" AS ENUM('basic', 'premium', 'featured');
  CREATE TYPE "public"."enum__businesses_v_version_advertising_slots_type" AS ENUM('image', 'video', 'offer');
  CREATE TYPE "public"."enum__businesses_v_version_membership_tier" AS ENUM('basic', 'premium', 'featured');
  CREATE TYPE "public"."enum_event_applications_status" AS ENUM('pending', 'approved', 'rejected', 'waitlist');
  ALTER TYPE "public"."enum_events_event_status" ADD VALUE 'draft' BEFORE 'published';
  ALTER TYPE "public"."enum__events_v_version_event_status" ADD VALUE 'draft' BEFORE 'published';
  CREATE TABLE "businesses_advertising_slots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_businesses_advertising_slots_type",
  	"media_id" integer,
  	"video_url" varchar
  );
  
  CREATE TABLE "businesses_advertising_slots_locales" (
  	"offer_title" varchar,
  	"offer_description" jsonb,
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_businesses_v_version_advertising_slots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum__businesses_v_version_advertising_slots_type",
  	"media_id" integer,
  	"video_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_businesses_v_version_advertising_slots_locales" (
  	"offer_title" varchar,
  	"offer_description" jsonb,
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "event_applications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" integer NOT NULL,
  	"applicant_name" varchar NOT NULL,
  	"applicant_email" varchar NOT NULL,
  	"applicant_phone" varchar NOT NULL,
  	"business_id" integer,
  	"category" varchar,
  	"details" jsonb NOT NULL,
  	"status" "enum_event_applications_status" DEFAULT 'pending' NOT NULL,
  	"submitted_date" timestamp(3) with time zone,
  	"notes" jsonb,
  	"submitted_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "event_applications_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "events" ALTER COLUMN "category" SET DATA TYPE text;
  DROP TYPE "public"."enum_events_category";
  CREATE TYPE "public"."enum_events_category" AS ENUM('chamber', 'community', 'networking', 'workshop', 'festival', 'fundraiser', 'social');
  ALTER TABLE "events" ALTER COLUMN "category" SET DATA TYPE "public"."enum_events_category" USING "category"::"public"."enum_events_category";
  ALTER TABLE "_events_v" ALTER COLUMN "version_category" SET DATA TYPE text;
  DROP TYPE "public"."enum__events_v_version_category";
  CREATE TYPE "public"."enum__events_v_version_category" AS ENUM('chamber', 'community', 'networking', 'workshop', 'festival', 'fundraiser', 'social');
  ALTER TABLE "_events_v" ALTER COLUMN "version_category" SET DATA TYPE "public"."enum__events_v_version_category" USING "version_category"::"public"."enum__events_v_version_category";
  ALTER TABLE "businesses" ADD COLUMN "city" varchar;
  ALTER TABLE "businesses" ADD COLUMN "state" varchar DEFAULT 'VT';
  ALTER TABLE "businesses" ADD COLUMN "zip_code" varchar;
  ALTER TABLE "businesses" ADD COLUMN "coordinates_latitude" numeric;
  ALTER TABLE "businesses" ADD COLUMN "coordinates_longitude" numeric;
  ALTER TABLE "businesses" ADD COLUMN "membership_expires" timestamp(3) with time zone;
  ALTER TABLE "businesses" ADD COLUMN "membership_tier" "enum_businesses_membership_tier" DEFAULT 'basic';
  ALTER TABLE "businesses_locales" ADD COLUMN "hours_of_operation" jsonb;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_city" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_state" varchar DEFAULT 'VT';
  ALTER TABLE "_businesses_v" ADD COLUMN "version_zip_code" varchar;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_coordinates_latitude" numeric;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_coordinates_longitude" numeric;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_membership_expires" timestamp(3) with time zone;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_membership_tier" "enum__businesses_v_version_membership_tier" DEFAULT 'basic';
  ALTER TABLE "_businesses_v_locales" ADD COLUMN "version_hours_of_operation" jsonb;
  ALTER TABLE "events" ADD COLUMN "end_date" timestamp(3) with time zone;
  ALTER TABLE "events" ADD COLUMN "address" varchar;
  ALTER TABLE "events" ADD COLUMN "city" varchar;
  ALTER TABLE "events" ADD COLUMN "state" varchar DEFAULT 'VT';
  ALTER TABLE "events" ADD COLUMN "zip_code" varchar;
  ALTER TABLE "events" ADD COLUMN "coordinates_latitude" numeric;
  ALTER TABLE "events" ADD COLUMN "coordinates_longitude" numeric;
  ALTER TABLE "events" ADD COLUMN "organizer" varchar;
  ALTER TABLE "events" ADD COLUMN "recurring" boolean DEFAULT false;
  ALTER TABLE "events" ADD COLUMN "external_url" varchar;
  ALTER TABLE "events" ADD COLUMN "submitted_by_id" integer;
  ALTER TABLE "_events_v" ADD COLUMN "version_end_date" timestamp(3) with time zone;
  ALTER TABLE "_events_v" ADD COLUMN "version_address" varchar;
  ALTER TABLE "_events_v" ADD COLUMN "version_city" varchar;
  ALTER TABLE "_events_v" ADD COLUMN "version_state" varchar DEFAULT 'VT';
  ALTER TABLE "_events_v" ADD COLUMN "version_zip_code" varchar;
  ALTER TABLE "_events_v" ADD COLUMN "version_coordinates_latitude" numeric;
  ALTER TABLE "_events_v" ADD COLUMN "version_coordinates_longitude" numeric;
  ALTER TABLE "_events_v" ADD COLUMN "version_organizer" varchar;
  ALTER TABLE "_events_v" ADD COLUMN "version_recurring" boolean DEFAULT false;
  ALTER TABLE "_events_v" ADD COLUMN "version_external_url" varchar;
  ALTER TABLE "_events_v" ADD COLUMN "version_submitted_by_id" integer;
  ALTER TABLE "signature_events" ADD COLUMN "application_open" boolean DEFAULT false;
  ALTER TABLE "signature_events" ADD COLUMN "application_deadline" timestamp(3) with time zone;
  ALTER TABLE "signature_events" ADD COLUMN "contact_email" varchar;
  ALTER TABLE "signature_events_locales" ADD COLUMN "application_form" jsonb;
  ALTER TABLE "_signature_events_v" ADD COLUMN "version_application_open" boolean DEFAULT false;
  ALTER TABLE "_signature_events_v" ADD COLUMN "version_application_deadline" timestamp(3) with time zone;
  ALTER TABLE "_signature_events_v" ADD COLUMN "version_contact_email" varchar;
  ALTER TABLE "_signature_events_v_locales" ADD COLUMN "version_application_form" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "event_applications_id" integer;
  ALTER TABLE "businesses_advertising_slots" ADD CONSTRAINT "businesses_advertising_slots_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "businesses_advertising_slots" ADD CONSTRAINT "businesses_advertising_slots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "businesses_advertising_slots_locales" ADD CONSTRAINT "businesses_advertising_slots_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."businesses_advertising_slots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_businesses_v_version_advertising_slots" ADD CONSTRAINT "_businesses_v_version_advertising_slots_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_businesses_v_version_advertising_slots" ADD CONSTRAINT "_businesses_v_version_advertising_slots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_businesses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_businesses_v_version_advertising_slots_locales" ADD CONSTRAINT "_businesses_v_version_advertising_slots_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_businesses_v_version_advertising_slots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_applications" ADD CONSTRAINT "event_applications_event_id_signature_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."signature_events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_applications" ADD CONSTRAINT "event_applications_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_applications" ADD CONSTRAINT "event_applications_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_applications_rels" ADD CONSTRAINT "event_applications_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."event_applications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_applications_rels" ADD CONSTRAINT "event_applications_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "businesses_advertising_slots_order_idx" ON "businesses_advertising_slots" USING btree ("_order");
  CREATE INDEX "businesses_advertising_slots_parent_id_idx" ON "businesses_advertising_slots" USING btree ("_parent_id");
  CREATE INDEX "businesses_advertising_slots_media_idx" ON "businesses_advertising_slots" USING btree ("media_id");
  CREATE UNIQUE INDEX "businesses_advertising_slots_locales_locale_parent_id_unique" ON "businesses_advertising_slots_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_businesses_v_version_advertising_slots_order_idx" ON "_businesses_v_version_advertising_slots" USING btree ("_order");
  CREATE INDEX "_businesses_v_version_advertising_slots_parent_id_idx" ON "_businesses_v_version_advertising_slots" USING btree ("_parent_id");
  CREATE INDEX "_businesses_v_version_advertising_slots_media_idx" ON "_businesses_v_version_advertising_slots" USING btree ("media_id");
  CREATE UNIQUE INDEX "_businesses_v_version_advertising_slots_locales_locale_paren" ON "_businesses_v_version_advertising_slots_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "event_applications_event_idx" ON "event_applications" USING btree ("event_id");
  CREATE INDEX "event_applications_business_idx" ON "event_applications" USING btree ("business_id");
  CREATE INDEX "event_applications_submitted_by_idx" ON "event_applications" USING btree ("submitted_by_id");
  CREATE INDEX "event_applications_updated_at_idx" ON "event_applications" USING btree ("updated_at");
  CREATE INDEX "event_applications_created_at_idx" ON "event_applications" USING btree ("created_at");
  CREATE INDEX "event_applications_rels_order_idx" ON "event_applications_rels" USING btree ("order");
  CREATE INDEX "event_applications_rels_parent_idx" ON "event_applications_rels" USING btree ("parent_id");
  CREATE INDEX "event_applications_rels_path_idx" ON "event_applications_rels" USING btree ("path");
  CREATE INDEX "event_applications_rels_media_id_idx" ON "event_applications_rels" USING btree ("media_id");
  ALTER TABLE "events" ADD CONSTRAINT "events_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_submitted_by_id_users_id_fk" FOREIGN KEY ("version_submitted_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_applications_fk" FOREIGN KEY ("event_applications_id") REFERENCES "public"."event_applications"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_submitted_by_idx" ON "events" USING btree ("submitted_by_id");
  CREATE INDEX "_events_v_version_version_submitted_by_idx" ON "_events_v" USING btree ("version_submitted_by_id");
  CREATE INDEX "payload_locked_documents_rels_event_applications_id_idx" ON "payload_locked_documents_rels" USING btree ("event_applications_id");
  ALTER TABLE "businesses" DROP COLUMN "generate_slug";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_generate_slug";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "businesses_advertising_slots" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "businesses_advertising_slots_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_businesses_v_version_advertising_slots" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_businesses_v_version_advertising_slots_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_applications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_applications_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "businesses_advertising_slots" CASCADE;
  DROP TABLE "businesses_advertising_slots_locales" CASCADE;
  DROP TABLE "_businesses_v_version_advertising_slots" CASCADE;
  DROP TABLE "_businesses_v_version_advertising_slots_locales" CASCADE;
  DROP TABLE "event_applications" CASCADE;
  DROP TABLE "event_applications_rels" CASCADE;
  ALTER TABLE "events" DROP CONSTRAINT "events_submitted_by_id_users_id_fk";
  
  ALTER TABLE "_events_v" DROP CONSTRAINT "_events_v_version_submitted_by_id_users_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_event_applications_fk";
  
  ALTER TABLE "events" ALTER COLUMN "category" SET DATA TYPE text;
  DROP TYPE "public"."enum_events_category";
  CREATE TYPE "public"."enum_events_category" AS ENUM('community', 'networking', 'workshop', 'fundraiser', 'social', 'other');
  ALTER TABLE "events" ALTER COLUMN "category" SET DATA TYPE "public"."enum_events_category" USING "category"::"public"."enum_events_category";
  ALTER TABLE "events" ALTER COLUMN "event_status" SET DATA TYPE text;
  ALTER TABLE "events" ALTER COLUMN "event_status" SET DEFAULT 'published'::text;
  DROP TYPE "public"."enum_events_event_status";
  CREATE TYPE "public"."enum_events_event_status" AS ENUM('published', 'cancelled');
  ALTER TABLE "events" ALTER COLUMN "event_status" SET DEFAULT 'published'::"public"."enum_events_event_status";
  ALTER TABLE "events" ALTER COLUMN "event_status" SET DATA TYPE "public"."enum_events_event_status" USING "event_status"::"public"."enum_events_event_status";
  ALTER TABLE "_events_v" ALTER COLUMN "version_category" SET DATA TYPE text;
  DROP TYPE "public"."enum__events_v_version_category";
  CREATE TYPE "public"."enum__events_v_version_category" AS ENUM('community', 'networking', 'workshop', 'fundraiser', 'social', 'other');
  ALTER TABLE "_events_v" ALTER COLUMN "version_category" SET DATA TYPE "public"."enum__events_v_version_category" USING "version_category"::"public"."enum__events_v_version_category";
  ALTER TABLE "_events_v" ALTER COLUMN "version_event_status" SET DATA TYPE text;
  ALTER TABLE "_events_v" ALTER COLUMN "version_event_status" SET DEFAULT 'published'::text;
  DROP TYPE "public"."enum__events_v_version_event_status";
  CREATE TYPE "public"."enum__events_v_version_event_status" AS ENUM('published', 'cancelled');
  ALTER TABLE "_events_v" ALTER COLUMN "version_event_status" SET DEFAULT 'published'::"public"."enum__events_v_version_event_status";
  ALTER TABLE "_events_v" ALTER COLUMN "version_event_status" SET DATA TYPE "public"."enum__events_v_version_event_status" USING "version_event_status"::"public"."enum__events_v_version_event_status";
  DROP INDEX "events_submitted_by_idx";
  DROP INDEX "_events_v_version_version_submitted_by_idx";
  DROP INDEX "payload_locked_documents_rels_event_applications_id_idx";
  ALTER TABLE "businesses" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_generate_slug" boolean DEFAULT true;
  ALTER TABLE "businesses" DROP COLUMN "city";
  ALTER TABLE "businesses" DROP COLUMN "state";
  ALTER TABLE "businesses" DROP COLUMN "zip_code";
  ALTER TABLE "businesses" DROP COLUMN "coordinates_latitude";
  ALTER TABLE "businesses" DROP COLUMN "coordinates_longitude";
  ALTER TABLE "businesses" DROP COLUMN "membership_expires";
  ALTER TABLE "businesses" DROP COLUMN "membership_tier";
  ALTER TABLE "businesses_locales" DROP COLUMN "hours_of_operation";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_city";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_state";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_zip_code";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_coordinates_latitude";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_coordinates_longitude";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_membership_expires";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_membership_tier";
  ALTER TABLE "_businesses_v_locales" DROP COLUMN "version_hours_of_operation";
  ALTER TABLE "events" DROP COLUMN "end_date";
  ALTER TABLE "events" DROP COLUMN "address";
  ALTER TABLE "events" DROP COLUMN "city";
  ALTER TABLE "events" DROP COLUMN "state";
  ALTER TABLE "events" DROP COLUMN "zip_code";
  ALTER TABLE "events" DROP COLUMN "coordinates_latitude";
  ALTER TABLE "events" DROP COLUMN "coordinates_longitude";
  ALTER TABLE "events" DROP COLUMN "organizer";
  ALTER TABLE "events" DROP COLUMN "recurring";
  ALTER TABLE "events" DROP COLUMN "external_url";
  ALTER TABLE "events" DROP COLUMN "submitted_by_id";
  ALTER TABLE "_events_v" DROP COLUMN "version_end_date";
  ALTER TABLE "_events_v" DROP COLUMN "version_address";
  ALTER TABLE "_events_v" DROP COLUMN "version_city";
  ALTER TABLE "_events_v" DROP COLUMN "version_state";
  ALTER TABLE "_events_v" DROP COLUMN "version_zip_code";
  ALTER TABLE "_events_v" DROP COLUMN "version_coordinates_latitude";
  ALTER TABLE "_events_v" DROP COLUMN "version_coordinates_longitude";
  ALTER TABLE "_events_v" DROP COLUMN "version_organizer";
  ALTER TABLE "_events_v" DROP COLUMN "version_recurring";
  ALTER TABLE "_events_v" DROP COLUMN "version_external_url";
  ALTER TABLE "_events_v" DROP COLUMN "version_submitted_by_id";
  ALTER TABLE "signature_events" DROP COLUMN "application_open";
  ALTER TABLE "signature_events" DROP COLUMN "application_deadline";
  ALTER TABLE "signature_events" DROP COLUMN "contact_email";
  ALTER TABLE "signature_events_locales" DROP COLUMN "application_form";
  ALTER TABLE "_signature_events_v" DROP COLUMN "version_application_open";
  ALTER TABLE "_signature_events_v" DROP COLUMN "version_application_deadline";
  ALTER TABLE "_signature_events_v" DROP COLUMN "version_contact_email";
  ALTER TABLE "_signature_events_v_locales" DROP COLUMN "version_application_form";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "event_applications_id";
  DROP TYPE "public"."enum_businesses_advertising_slots_type";
  DROP TYPE "public"."enum_businesses_membership_tier";
  DROP TYPE "public"."enum__businesses_v_version_advertising_slots_type";
  DROP TYPE "public"."enum__businesses_v_version_membership_tier";
  DROP TYPE "public"."enum_event_applications_status";`)
}
