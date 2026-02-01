import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Remove recurrenceStartDate and recurrenceEndDate columns from events table
  // These are no longer needed - we now use the main date and endDate fields
  await db.execute(sql`
    ALTER TABLE "events" DROP COLUMN IF EXISTS "recurrence_recurrence_start_date";
  `)

  await db.execute(sql`
    ALTER TABLE "events" DROP COLUMN IF EXISTS "recurrence_recurrence_end_date";
  `)

  // Also remove from _events_v (versioned table) if it exists
  await db.execute(sql`
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_recurrence_recurrence_start_date";
  `)

  await db.execute(sql`
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_recurrence_recurrence_end_date";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Re-add columns if rolling back
  await db.execute(sql`
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "recurrence_recurrence_start_date" timestamp(3) with time zone;
  `)

  await db.execute(sql`
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "recurrence_recurrence_end_date" timestamp(3) with time zone;
  `)

  await db.execute(sql`
    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_recurrence_recurrence_start_date" timestamp(3) with time zone;
  `)

  await db.execute(sql`
    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_recurrence_recurrence_end_date" timestamp(3) with time zone;
  `)
}
