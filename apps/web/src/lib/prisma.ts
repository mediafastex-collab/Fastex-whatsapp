import { getRequestContext } from "@cloudflare/next-on-pages";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

/**
 * Returns a PrismaClient bound to the Cloudflare D1 database for the current
 * request.
 *
 * With the D1 driver adapter, Prisma must be imported from the regular
 * `@prisma/client` entrypoint (NOT `/edge`, which is for Accelerate/Data Proxy
 * and rejects the `adapter` option). Bare Node built-ins it references (e.g.
 * async_hooks) resolve at runtime because compatibility_date >= 2024-09-23.
 *
 * A fresh client is created per request: reusing a D1-bound client across
 * requests triggers Cloudflare's "Cannot perform I/O on behalf of a different
 * request" error.
 */
export function getPrisma(): PrismaClient {
  const { env } = getRequestContext();
  const db = (env as any).DB;
  if (!db) {
    throw new Error(
      "D1 binding 'DB' is not available. Bind the fastex-crm-db database to the Pages project (variable name DB)."
    );
  }
  const adapter = new PrismaD1(db);
  return new PrismaClient({ adapter });
}
