import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "benefits" ADD COLUMN "link_text" varchar;
  ALTER TABLE "_benefits_v" ADD COLUMN "version_link_text" varchar;
  ALTER TABLE "benefits" DROP COLUMN "benefit_type";
  ALTER TABLE "benefits_locales" DROP COLUMN "details";
  ALTER TABLE "_benefits_v" DROP COLUMN "version_benefit_type";
  ALTER TABLE "_benefits_v_locales" DROP COLUMN "version_details";
  DROP TYPE "public"."enum_benefits_benefit_type";
  DROP TYPE "public"."enum__benefits_v_version_benefit_type";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_benefits_benefit_type" AS ENUM('coupon', 'discount', 'special_offer', 'free_service', 'member_exclusive');
  CREATE TYPE "public"."enum__benefits_v_version_benefit_type" AS ENUM('coupon', 'discount', 'special_offer', 'free_service', 'member_exclusive');
  ALTER TABLE "benefits" ADD COLUMN "benefit_type" "enum_benefits_benefit_type";
  ALTER TABLE "benefits_locales" ADD COLUMN "details" jsonb;
  ALTER TABLE "_benefits_v" ADD COLUMN "version_benefit_type" "enum__benefits_v_version_benefit_type";
  ALTER TABLE "_benefits_v_locales" ADD COLUMN "version_details" jsonb;
  ALTER TABLE "benefits" DROP COLUMN "link_text";
  ALTER TABLE "_benefits_v" DROP COLUMN "version_link_text";`)
}
