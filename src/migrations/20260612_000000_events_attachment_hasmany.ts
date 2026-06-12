import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "events_rels" (
   	"id" serial PRIMARY KEY NOT NULL,
   	"order" integer,
   	"parent_id" integer NOT NULL,
   	"path" varchar NOT NULL,
   	"media_id" integer
   );

   -- Preserve existing single attachments as the first item of the new hasMany relationship
   INSERT INTO "events_rels" ("parent_id", "path", "media_id", "order")
   	SELECT "id", 'attachment', "attachment_id", 1 FROM "events" WHERE "attachment_id" IS NOT NULL;

   ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
   ALTER TABLE "events_rels" ADD CONSTRAINT "events_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;

   CREATE INDEX "events_rels_order_idx" ON "events_rels" USING btree ("order");
   CREATE INDEX "events_rels_parent_idx" ON "events_rels" USING btree ("parent_id");
   CREATE INDEX "events_rels_path_idx" ON "events_rels" USING btree ("path");
   CREATE INDEX "events_rels_media_id_idx" ON "events_rels" USING btree ("media_id");

   ALTER TABLE "events" DROP CONSTRAINT "events_attachment_id_media_id_fk";
   DROP INDEX "events_attachment_idx";
   ALTER TABLE "events" DROP COLUMN "attachment_id";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" ADD COLUMN "attachment_id" integer;

   -- Collapse the hasMany relationship back to a single attachment (keeps the first item)
   UPDATE "events" SET "attachment_id" = (
   	SELECT "media_id" FROM "events_rels"
   	WHERE "parent_id" = "events"."id" AND "path" = 'attachment' AND "media_id" IS NOT NULL
   	ORDER BY "order" LIMIT 1
   );

   ALTER TABLE "events" ADD CONSTRAINT "events_attachment_id_media_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   CREATE INDEX "events_attachment_idx" ON "events" USING btree ("attachment_id");

   DROP TABLE "events_rels" CASCADE;
  `)
}
