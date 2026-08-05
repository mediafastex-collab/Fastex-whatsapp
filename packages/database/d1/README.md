# Cloudflare D1 — initialize the database

The web app (`apps/web`) talks to Cloudflare D1 through the `DB` binding at request
time (see `apps/web/src/lib/prisma.ts`). Prisma's `db push` only touches the local
SQLite file — it does **not** create the D1 tables. Apply these SQL files once with
Wrangler instead.

Prerequisites:
- A D1 database named `fastex-crm-db` created in your Cloudflare dashboard.
- The Pages project bound to it with variable name `DB`
  (Settings → Functions → D1 database bindings). See `../../../CLOUDFLARE_D1_SETUP.md`.
- `wrangler` authenticated (`npx wrangler login`).

Run from the repo root:

```bash
# 1. Create tables + indexes
npx wrangler d1 execute fastex-crm-db --remote --file=packages/database/d1/schema.sql

# 2. Seed users, default settings, and the session row
npx wrangler d1 execute fastex-crm-db --remote --file=packages/database/d1/seed.sql
```

Seeded logins (change these passwords for production):
- Admin: `admin@business.com` / `Admin@123456`
- Sales: `sales1@business.com` / `Sales@123456`
- Sales: `sales2@business.com` / `Sales@123456`

Both files are idempotent (`INSERT OR IGNORE`), so re-running the seed is safe.

To regenerate `schema.sql` after changing `prisma/schema.prisma`:

```bash
cd packages/database && pnpm exec prisma migrate diff \
  --from-empty --to-schema-datamodel prisma/schema.prisma --script > d1/schema.sql
```
