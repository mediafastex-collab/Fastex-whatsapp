import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function resolveD1Binding(): any {
  // Cloudflare D1 binding may be exposed on globalThis or process.env depending on runtime.
  if (typeof globalThis !== "undefined" && (globalThis as any).DB) return (globalThis as any).DB;
  if (typeof process !== "undefined" && (process.env as any)?.DB) return (process.env as any).DB;
  return null;
}

function createPrismaClient(): PrismaClient {
  const d1Binding = resolveD1Binding();

  if (d1Binding) {
    try {
      const { PrismaD1 } = require("@prisma/adapter-d1");
      const adapter = new PrismaD1(d1Binding);
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
