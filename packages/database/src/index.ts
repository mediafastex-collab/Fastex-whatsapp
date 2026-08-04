import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  global.prismaGlobal ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

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
