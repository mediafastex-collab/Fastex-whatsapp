import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function resolveD1Binding(): any {
  // Fallback binding locations (module scope). On Cloudflare Pages the binding
  // actually lives on the per-request context — see getPrisma() in the web app,
  // which passes it explicitly to createPrismaClient().
  if (typeof globalThis !== "undefined" && (globalThis as any).DB) return (globalThis as any).DB;
  if (typeof process !== "undefined" && (process.env as any)?.DB) return (process.env as any).DB;
  return null;
}

/**
 * Builds a PrismaClient. When a Cloudflare D1 binding is provided (or found on
 * globalThis/process.env), it uses the D1 driver adapter; otherwise it returns
 * a standard client (local Node/SQLite development).
 */
export function createPrismaClient(d1Binding?: any): PrismaClient {
  const binding = d1Binding || resolveD1Binding();

  if (binding) {
    try {
      const { PrismaD1 } = require("@prisma/adapter-d1");
      const adapter = new PrismaD1(binding);
      return new PrismaClient({ adapter } as any);
    } catch (e) {
      console.warn("D1 binding detected but @prisma/adapter-d1 load failed. Falling back to default client.", e);
    }
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

/**
 * Lazily instantiate PrismaClient on first property access. This is essential
 * for the Edge/Cloudflare build: Next.js evaluates route modules during
 * "collect page data", and constructing PrismaClient without a driver adapter
 * throws on the Edge runtime. Deferring construction until an actual query runs
 * keeps the build green while still binding to D1 at request time.
 */
function getClient(): PrismaClient {
  if (!global.prismaGlobal) {
    global.prismaGlobal = createPrismaClient();
  }
  return global.prismaGlobal;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client as any, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export * from "@prisma/client";

export type Role = "ADMIN" | "SALESPERSON";
export type ConnectionStatus =
  | "NOT_CONNECTED"
  | "INITIALIZING"
  | "QR_CODE_REQUIRED"
  | "QR_CODE_GENERATED"
  | "AUTHENTICATING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "AUTHENTICATION_FAILED"
  | "RECONNECTING";
export type MessageStatus =
  | "PENDING"
  | "QUEUED"
  | "PROCESSING"
  | "SENT"
  | "ACKNOWLEDGED"
  | "DELIVERED"
  | "READ"
  | "FAILED"
  | "CANCELLED";
export type MessageType =
  | "AUTOMATIC_WELCOME"
  | "MANUAL_WELCOME"
  | "MANUAL_CUSTOM"
  | "RETRY"
  | "TEST";
