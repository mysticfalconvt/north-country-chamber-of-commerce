// Payload 3.89 -> 3.93 upgrade.
//   3.90: users.reset_password_requested_at (forgot-password throttling).
//   3.91: indexes on _parent_id for localized tables.
// Written with IF [NOT] EXISTS so it applies cleanly whether or not a past
// dev-mode schema push already added any of these. Generated against the
// 20260612 snapshot, which matches the current schema minus these changes.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_requested_at" timestamp(3) with time zone;
  CREATE INDEX IF NOT EXISTS "pages_hero_links_locales_parent_id_idx" ON "pages_hero_links_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_locales_parent_id_idx" ON "pages_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_version_hero_links_locales_parent_id_idx" ON "_pages_v_version_hero_links_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_locales_parent_id_idx" ON "_pages_v_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "businesses_advertising_slots_locales_parent_id_idx" ON "businesses_advertising_slots_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "businesses_locales_parent_id_idx" ON "businesses_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_businesses_v_version_advertising_slots_locales_parent_i_idx" ON "_businesses_v_version_advertising_slots_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_businesses_v_locales_parent_id_idx" ON "_businesses_v_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "benefits_locales_parent_id_idx" ON "benefits_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_benefits_v_locales_parent_id_idx" ON "_benefits_v_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "events_locales_parent_id_idx" ON "events_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "news_locales_parent_id_idx" ON "news_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_news_v_locales_parent_id_idx" ON "_news_v_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "categories_locales_parent_id_idx" ON "categories_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_checkbox_locales_parent_id_idx" ON "forms_blocks_checkbox_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_country_locales_parent_id_idx" ON "forms_blocks_country_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_email_locales_parent_id_idx" ON "forms_blocks_email_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_message_locales_parent_id_idx" ON "forms_blocks_message_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_number_locales_parent_id_idx" ON "forms_blocks_number_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_select_options_locales_parent_id_idx" ON "forms_blocks_select_options_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_select_locales_parent_id_idx" ON "forms_blocks_select_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_state_locales_parent_id_idx" ON "forms_blocks_state_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_text_locales_parent_id_idx" ON "forms_blocks_text_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_blocks_textarea_locales_parent_id_idx" ON "forms_blocks_textarea_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_emails_locales_parent_id_idx" ON "forms_emails_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "forms_locales_parent_id_idx" ON "forms_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "search_locales_parent_id_idx" ON "search_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "header_nav_items_locales_parent_id_idx" ON "header_nav_items_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "footer_nav_items_locales_parent_id_idx" ON "footer_nav_items_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "footer_locales_parent_id_idx" ON "footer_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "membership_tiers_tiers_locales_parent_id_idx" ON "membership_tiers_tiers_locales" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "banners_active_banners_locales_parent_id_idx" ON "banners_active_banners_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "pages_hero_links_locales_parent_id_idx";
  DROP INDEX IF EXISTS "pages_locales_parent_id_idx";
  DROP INDEX IF EXISTS "_pages_v_version_hero_links_locales_parent_id_idx";
  DROP INDEX IF EXISTS "_pages_v_locales_parent_id_idx";
  DROP INDEX IF EXISTS "businesses_advertising_slots_locales_parent_id_idx";
  DROP INDEX IF EXISTS "businesses_locales_parent_id_idx";
  DROP INDEX IF EXISTS "_businesses_v_version_advertising_slots_locales_parent_i_idx";
  DROP INDEX IF EXISTS "_businesses_v_locales_parent_id_idx";
  DROP INDEX IF EXISTS "benefits_locales_parent_id_idx";
  DROP INDEX IF EXISTS "_benefits_v_locales_parent_id_idx";
  DROP INDEX IF EXISTS "events_locales_parent_id_idx";
  DROP INDEX IF EXISTS "news_locales_parent_id_idx";
  DROP INDEX IF EXISTS "_news_v_locales_parent_id_idx";
  DROP INDEX IF EXISTS "categories_locales_parent_id_idx";
  DROP INDEX IF EXISTS "forms_blocks_checkbox_locales_parent_id_idx";
  DROP INDEX IF EXISTS "forms_blocks_country_locales_parent_id_idx";
  DROP INDEX IF EXISTS "forms_blocks_email_locales_parent_id_idx";
  DROP INDEX IF EXISTS "forms_blocks_message_locales_parent_id_idx";
  DROP INDEX IF EXISTS "forms_blocks_number_locales_parent_id_idx";
  DROP INDEX IF EXISTS "forms_blocks_select_options_locales_parent_id_idx";
  DROP INDEX IF EXISTS "forms_blocks_select_locales_parent_id_idx";
  DROP INDEX IF EXISTS "forms_blocks_state_locales_parent_id_idx";
  DROP INDEX IF EXISTS "forms_blocks_text_locales_parent_id_idx";
  DROP INDEX IF EXISTS "forms_blocks_textarea_locales_parent_id_idx";
  DROP INDEX IF EXISTS "forms_emails_locales_parent_id_idx";
  DROP INDEX IF EXISTS "forms_locales_parent_id_idx";
  DROP INDEX IF EXISTS "search_locales_parent_id_idx";
  DROP INDEX IF EXISTS "header_nav_items_locales_parent_id_idx";
  DROP INDEX IF EXISTS "footer_nav_items_locales_parent_id_idx";
  DROP INDEX IF EXISTS "footer_locales_parent_id_idx";
  DROP INDEX IF EXISTS "membership_tiers_tiers_locales_parent_id_idx";
  DROP INDEX IF EXISTS "banners_active_banners_locales_parent_id_idx";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_requested_at";`)
}
