import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const d1Binding =
    (typeof process !== "undefined" && (process.env as any)?.DB) ||
    (typeof globalThis !== "undefined" && (globalThis as any).DB);

  if (d1Binding) {
    try {
      const { PrismaD1 } = require("@prisma/adapter-d1");
      const adapter = new PrismaD1(d1Binding);
      return new PrismaClient({ adapter } as any);
    } catch (e) {
      console.warn("D1 binding detected but @prisma/adapter-d1 load failed. Falling back to default SQLite.", e);
    }
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = global.prismaGlobal || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}

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
