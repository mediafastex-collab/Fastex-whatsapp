import { getRequestContext } from "@cloudflare/next-on-pages";
import { PrismaClient } from "@prisma/client/edge";
import { PrismaD1 } from "@prisma/adapter-d1";

/**
 * Returns a PrismaClient bound to the Cloudflare D1 database for the current
 * request.
 *
 * We use `@prisma/client/edge` (not the Node client) because the Node client
 * imports `async_hooks`, which the Cloudflare Edge bundle cannot resolve
 * ("No such module async_hooks"). The edge client + D1 driver adapter is the
 * supported combination on Cloudflare Pages/Workers.
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
