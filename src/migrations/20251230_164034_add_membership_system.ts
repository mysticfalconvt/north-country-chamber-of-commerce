import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_memberships_tier" AS ENUM('basic', 'premium', 'featured');
  CREATE TYPE "public"."enum_memberships_payment_status" AS ENUM('pending', 'paid', 'overdue', 'cancelled', 'refunded');
  CREATE TYPE "public"."enum_memberships_payment_method" AS ENUM('stripe', 'check', 'cash', 'comp');
  CREATE TABLE "memberships" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"business_id" integer NOT NULL,
  	"tier" "enum_memberships_tier" NOT NULL,
  	"amount" numeric NOT NULL,
  	"payment_status" "enum_memberships_payment_status" DEFAULT 'pending' NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone NOT NULL,
  	"auto_renew" boolean DEFAULT false,
  	"payment_method" "enum_memberships_payment_method" DEFAULT 'stripe' NOT NULL,
  	"stripe_customer_id" varchar,
  	"stripe_subscription_id" varchar,
  	"stripe_invoice_id" varchar,
  	"invoice_url" varchar,
  	"notes" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "membership_tiers_tiers_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"feature" varchar NOT NULL
  );
  
  CREATE TABLE "membership_tiers_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"annual_price" numeric NOT NULL,
  	"advertising_slots" numeric DEFAULT 0,
  	"featured_in_directory" boolean DEFAULT false,
  	"active" boolean DEFAULT true,
  	"stripe_price_id" varchar
  );
  
  CREATE TABLE "membership_tiers_tiers_locales" (
  	"name" varchar NOT NULL,
  	"description" jsonb NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "membership_tiers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "businesses" ADD COLUMN "owner_id" integer;
  ALTER TABLE "_businesses_v" ADD COLUMN "version_owner_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "memberships_id" integer;
  ALTER TABLE "memberships" ADD CONSTRAINT "memberships_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "membership_tiers_tiers_features" ADD CONSTRAINT "membership_tiers_tiers_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."membership_tiers_tiers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "membership_tiers_tiers" ADD CONSTRAINT "membership_tiers_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."membership_tiers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "membership_tiers_tiers_locales" ADD CONSTRAINT "membership_tiers_tiers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."membership_tiers_tiers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "memberships_business_idx" ON "memberships" USING btree ("business_id");
  CREATE INDEX "memberships_updated_at_idx" ON "memberships" USING btree ("updated_at");
  CREATE INDEX "memberships_created_at_idx" ON "memberships" USING btree ("created_at");
  CREATE INDEX "membership_tiers_tiers_features_order_idx" ON "membership_tiers_tiers_features" USING btree ("_order");
  CREATE INDEX "membership_tiers_tiers_features_parent_id_idx" ON "membership_tiers_tiers_features" USING btree ("_parent_id");
  CREATE INDEX "membership_tiers_tiers_features_locale_idx" ON "membership_tiers_tiers_features" USING btree ("_locale");
  CREATE INDEX "membership_tiers_tiers_order_idx" ON "membership_tiers_tiers" USING btree ("_order");
  CREATE INDEX "membership_tiers_tiers_parent_id_idx" ON "membership_tiers_tiers" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "membership_tiers_tiers_slug_idx" ON "membership_tiers_tiers" USING btree ("slug");
  CREATE UNIQUE INDEX "membership_tiers_tiers_locales_locale_parent_id_unique" ON "membership_tiers_tiers_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_businesses_v" ADD CONSTRAINT "_businesses_v_version_owner_id_users_id_fk" FOREIGN KEY ("version_owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_memberships_fk" FOREIGN KEY ("memberships_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "businesses_owner_idx" ON "businesses" USING btree ("owner_id");
  CREATE INDEX "_businesses_v_version_version_owner_idx" ON "_businesses_v" USING btree ("version_owner_id");
  CREATE INDEX "payload_locked_documents_rels_memberships_id_idx" ON "payload_locked_documents_rels" USING btree ("memberships_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "memberships" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "membership_tiers_tiers_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "membership_tiers_tiers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "membership_tiers_tiers_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "membership_tiers" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "memberships" CASCADE;
  DROP TABLE "membership_tiers_tiers_features" CASCADE;
  DROP TABLE "membership_tiers_tiers" CASCADE;
  DROP TABLE "membership_tiers_tiers_locales" CASCADE;
  DROP TABLE "membership_tiers" CASCADE;
  ALTER TABLE "businesses" DROP CONSTRAINT "businesses_owner_id_users_id_fk";
  
  ALTER TABLE "_businesses_v" DROP CONSTRAINT "_businesses_v_version_owner_id_users_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_memberships_fk";
  
  DROP INDEX "businesses_owner_idx";
  DROP INDEX "_businesses_v_version_version_owner_idx";
  DROP INDEX "payload_locked_documents_rels_memberships_id_idx";
  ALTER TABLE "businesses" DROP COLUMN "owner_id";
  ALTER TABLE "_businesses_v" DROP COLUMN "version_owner_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "memberships_id";
  DROP TYPE "public"."enum_memberships_tier";
  DROP TYPE "public"."enum_memberships_payment_status";
  DROP TYPE "public"."enum_memberships_payment_method";`)
}
