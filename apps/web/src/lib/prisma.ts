import { getRequestContext } from "@cloudflare/next-on-pages";
import { createPrismaClient, prisma as globalPrisma, PrismaClient } from "@fastex/database";

/**
 * Returns a PrismaClient for the current request.
 *
 * On Cloudflare Pages the D1 binding lives on the per-request context, and a
 * D1-backed client must be created per request (reusing one across requests
 * triggers Cloudflare's "Cannot perform I/O on behalf of a different request"
 * error). Locally (next dev / Node) there is no request context, so we reuse
 * the shared singleton against the default SQLite database.
 */
export function getPrisma(): PrismaClient {
  let d1: any = null;
  try {
    d1 = (getRequestContext() as any)?.env?.DB ?? null;
  } catch {
    // No Cloudflare request context (local dev or build) — fall through.
  }

  if (d1) {
    return createPrismaClient(d1);
  }

  return globalPrisma;
}
