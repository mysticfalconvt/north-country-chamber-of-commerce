# Deployment

The live site is **https://www.vtnorthcountry.org** (Cloudflare tunnel → Coolify).

## How it deploys

- **Coolify** app "Chamber of commerce Next-js app" builds from `main` with **Railpack**.
  A push to `main` deploys.
- Railpack takes Node from `package.json` `engines.node` (resolves to the newest
  22.x; Payload 3.92+ needs ≥ 22.23.4) and pnpm from `packageManager`.
- Build: `pnpm install --frozen-lockfile`, then `pnpm build` (which also runs
  `next-sitemap` as `postbuild`). Start: `pnpm start`.
- The build container cannot reach the database, so the build log shows ~20
  `cannot connect to Postgres … ENOTFOUND` errors while it prerenders. That is
  expected and harmless: those pages render at request time instead.
- Uploaded media lives in a Coolify persistent volume mounted at `/app/public/media`,
  backed up nightly to RustFS (see the homelab repo, `infrastructure/disaster-recovery.md`).
- Errors go to Bugsink via `@sentry/nextjs`.

## Database migrations (manual)

**Nothing runs `payload migrate` in production.** There is no `prodMigrations` and no
entrypoint. A schema change must be applied to the production database by hand
**before** the code that needs it is pushed. Write migrations so the currently
deployed code still works after they are applied (additive first, removals later),
and use `IF [NOT] EXISTS` so they can be re-run.

1. Create the migration locally (`pnpm payload migrate:create <name>`), register it
   in `src/migrations/index.ts`, and commit it with the code change.
2. Take a backup of the production database in Coolify (Database → Backups → Backup now).
3. Get a production `DATABASE_URL` (Coolify database resource; it is published on
   `10.0.0.104:3718` while the public port is enabled). Never commit it.
4. Check what the database has (read-only):
   `DATABASE_URL='…' node .ai/scripts/db-status.mjs`
5. Dry run, then apply, one migration at a time:
   `DATABASE_URL='…' node .ai/scripts/apply-migration.mjs <name>` then add `--apply`.
   This runs the migration's UP SQL in one transaction and records it in
   `payload_migrations`.
6. Push to `main` and watch the Coolify deploy.

`.ai/` is git-ignored; if those scripts are missing, the equivalent is to run the
UP SQL from the migration file in `psql` inside `BEGIN; … COMMIT;` and insert a row
into `payload_migrations (name, batch, updated_at, created_at)`.

Do **not** run `pnpm dev` against the production database: Payload's dev mode pushes
schema changes directly (the production DB already carries a `dev` marker in
`payload_migrations` from a past push).

## Rollback

Redeploy the previous deployment from Coolify. Because migrations are additive and
applied ahead of the code, the old code keeps working against the newer schema.
