import { Client, LocalAuth } from "whatsapp-web.js";
import fs from "fs";
import Redis from "ioredis";
import { config } from "../config/env";
import { prisma, ConnectionStatus } from "@fastex/database";

export class WhatsAppManager {
  private static instance: WhatsAppManager;
  private client: Client | null = null;
  private redis: Redis;
  private currentStatus: ConnectionStatus = "NOT_CONNECTED";
  private currentQr: string | null = null;
  private lastError: string | null = null;
  private sseClients: Set<(data: any) => void> = new Set();
  private lockKey = `whatsapp:worker:session_lock:${config.sessionName}`;

  private constructor() {
    this.redis = new Redis(config.redisUrl, { maxRetriesPerRequest: 1, retryStrategy: () => null });
    this.redis.on("error", (e) => {
      // Suppress noisy redis connection errors when running in local standalone dev mode without Redis
    });
    this.ensureAuthDirPermissions();
  }

  public static getInstance(): WhatsAppManager {
    if (!WhatsAppManager.instance) {
      WhatsAppManager.instance = new WhatsAppManager();
    }
    return WhatsAppManager.instance;
  }

  private ensureAuthDirPermissions() {
    try {
      if (!fs.existsSync(config.authDir)) {
        fs.mkdirSync(config.authDir, { recursive: true, mode: 0o700 });
      } else {
        fs.chmodSync(config.authDir, 0o700);
      }
    } catch (e) {
      console.warn("Could not set strict 0700 permissions on auth dir (safe on Windows/DEV):", e);
    }
  }

  public async acquireSessionLock(): Promise<boolean> {
    try {
      // 30 seconds TTL lock, renewed periodically while worker is running
      const acquired = await this.redis.set(this.lockKey, config.workerId, "EX", 30, "NX");
      if (acquired === "OK") {
        setInterval(async () => {
          if (this.client) {
            await this.redis.expire(this.lockKey, 30);
          }
        }, 10000);
        return true;
      }
      const existingOwner = await this.redis.get(this.lockKey);
      if (existingOwner === config.workerId) {
        return true;
      }
      return false;
    } catch (e) {
      console.error("Redis session lock check error:", e);
      return true; // Fallback in local dev if redis lock fails
    }
  }

  public async initialize(): Promise<void> {
    if (this.client) {
      console.log("WhatsApp client is already initialized.");
      return;
    }

    const hasLock = await this.acquireSessionLock();
    if (!hasLock) {
      throw new Error("Another WhatsApp worker instance is already controlling session: " + config.sessionName);
    }

    this.setStatus("INITIALIZING");

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: config.sessionName,
        dataPath: config.authDir,
      }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
        ],
      },
    });

    this.registerEventListeners();
    await this.client.initialize();
  }

  private registerEventListeners() {
    if (!this.client) return;

    this.client.on("qr", async (qr: string) => {
      console.log("QR Code generated for session:", config.sessionName);
      this.currentQr = qr;
      this.setStatus("QR_CODE_GENERATED");
      await prisma.whatsAppSession.upsert({
        where: { sessionName: config.sessionName },
        update: {
          connectionStatus: "QR_CODE_GENERATED",
          lastQrGeneratedAt: new Date(),
          authStatus: "UNAUTHENTICATED",
          workerInstanceId: config.workerId,
        },
        create: {
          sessionName: config.sessionName,
          connectionStatus: "QR_CODE_GENERATED",
          lastQrGeneratedAt: new Date(),
          authStatus: "UNAUTHENTICATED",
          workerInstanceId: config.workerId,
        },
      });
    });

    this.client.on("authenticated", async () => {
      console.log("WhatsApp session authenticated!");
      this.currentQr = null;
      this.lastError = null;
      this.setStatus("AUTHENTICATING");
      await prisma.whatsAppSession.upsert({
        where: { sessionName: config.sessionName },
        update: {
          connectionStatus: "AUTHENTICATING",
          authStatus: "AUTHENTICATED",
        },
        create: {
          sessionName: config.sessionName,
          connectionStatus: "AUTHENTICATING",
          authStatus: "AUTHENTICATED",
        },
      });
    });

    this.client.on("auth_failure", async (msg: string) => {
      console.error("WhatsApp authentication failure:", msg);
      this.lastError = msg || "Authentication failure";
      this.currentQr = null;
      this.setStatus("AUTHENTICATION_FAILED");
      await prisma.whatsAppSession.upsert({
        where: { sessionName: config.sessionName },
        update: {
          connectionStatus: "AUTHENTICATION_FAILED",
          lastError: this.lastError,
          authStatus: "FAILED",
        },
        create: {
          sessionName: config.sessionName,
          connectionStatus: "AUTHENTICATION_FAILED",
          lastError: this.lastError,
          authStatus: "FAILED",
        },
      });
    });

    this.client.on("ready", async () => {
      console.log("WhatsApp client is ready!");
      this.currentQr = null;
      this.lastError = null;
      this.setStatus("CONNECTED");

      let phone: string | null = null;
      let name: string | null = null;
      try {
        const info = this.client?.info;
        if (info) {
          phone = info.wid?.user ? `+${info.wid.user}` : null;
          name = info.pushname || "Business Account";
        }
      } catch (e) {
        console.warn("Could not retrieve info properties on ready:", e);
      }

      await prisma.whatsAppSession.upsert({
        where: { sessionName: config.sessionName },
        update: {
          connectionStatus: "CONNECTED",
          lastConnectedAt: new Date(),
          phoneNumber: phone,
          profileName: name,
          authStatus: "AUTHENTICATED",
          workerInstanceId: config.workerId,
          lastError: null,
        },
        create: {
          sessionName: config.sessionName,
          connectionStatus: "CONNECTED",
          lastConnectedAt: new Date(),
          phoneNumber: phone,
          profileName: name,
          authStatus: "AUTHENTICATED",
          workerInstanceId: config.workerId,
          lastError: null,
        },
      });
    });

    this.client.on("disconnected", async (reason: string) => {
      console.warn("WhatsApp client disconnected:", reason);
      this.currentQr = null;
      this.lastError = `Disconnected: ${reason}`;
      this.setStatus("DISCONNECTED");

      await prisma.whatsAppSession.upsert({
        where: { sessionName: config.sessionName },
        update: {
          connectionStatus: "DISCONNECTED",
          lastDisconnectedAt: new Date(),
          authStatus: "DISCONNECTED",
          lastError: this.lastError,
        },
        create: {
          sessionName: config.sessionName,
          connectionStatus: "DISCONNECTED",
          lastDisconnectedAt: new Date(),
          authStatus: "DISCONNECTED",
          lastError: this.lastError,
        },
      });

      // Automatically attempt limited reconnect after backoff
      setTimeout(() => {
        if (this.currentStatus === "DISCONNECTED") {
          console.log("Attempting automatic reconnect...");
          this.restart();
        }
      }, 10000);
    });

    this.client.on("message_ack", async (msg: any, ack: number) => {
      try {
        const statusMap: Record<number, any> = {
          1: "SENT",
          2: "DELIVERED",
          3: "READ",
        };
        const newStatus = statusMap[ack];
        if (!newStatus) return;

        const record = await prisma.whatsAppMessage.findFirst({
          where: {
            OR: [
              { whatsappMessageId: msg.id?._serialized },
              { whatsappMessageId: msg.id?.id },
            ],
          },
        });

        if (record) {
          const updateData: any = { status: newStatus };
          if (newStatus === "SENT" && !record.sentAt) updateData.sentAt = new Date();
          if (newStatus === "DELIVERED" && !record.deliveredAt) updateData.deliveredAt = new Date();
          if (newStatus === "READ" && !record.readAt) updateData.readAt = new Date();

          await prisma.whatsAppMessage.update({
            where: { id: record.id },
            data: updateData,
          });

          this.broadcast({
            type: "MESSAGE_ACK",
            messageId: record.id,
            status: newStatus,
          });
        }
      } catch (e) {
        console.error("Error processing message_ack:", e);
      }
    });
  }

  public setStatus(status: ConnectionStatus) {
    this.currentStatus = status;
    this.broadcast({
      type: "STATUS_CHANGE",
      status: this.currentStatus,
      qrCode: this.currentQr,
      error: this.lastError,
    });
  }

  public getStatus(): any {
    return {
      connectionStatus: this.currentStatus,
      qrCode: this.currentQr,
      authError: this.lastError,
      workerInstanceId: config.workerId,
    };
  }

  public isReady(): boolean {
    return this.currentStatus === "CONNECTED" && !!this.client;
  }

  public async sendWhatsAppMessage(recipientId: string, content: string): Promise<string> {
    if (!this.client || this.currentStatus !== "CONNECTED") {
      throw new Error("WhatsApp client is not connected");
    }

    const response = await this.client.sendMessage(recipientId, content);
    return response.id?._serialized || response.id?.id || "unknown_msg_id";
  }

  public async checkNumberRegistered(recipientId: string): Promise<boolean> {
    if (!this.client || this.currentStatus !== "CONNECTED") {
      throw new Error("WhatsApp client is not connected");
    }

    const isRegistered = await this.client.isRegisteredUser(recipientId);
    return !!isRegistered;
  }

  public async restart(): Promise<void> {
    console.log("Restarting WhatsApp worker client without deleting LocalAuth session...");
    try {
      if (this.client) {
        await this.client.destroy();
        this.client = null;
      }
    } catch (e) {
      console.warn("Error destroying previous client on restart:", e);
    }
    this.currentStatus = "RECONNECTING";
    await this.initialize();
  }

  public async logout(): Promise<void> {
    console.log("Logging out WhatsApp account and destroying LocalAuth session...");
    try {
      if (this.client) {
        await this.client.logout();
        await this.client.destroy();
        this.client = null;
      }
    } catch (e) {
      console.warn("Error during client logout:", e);
    }

    this.currentQr = null;
    this.lastError = null;
    this.setStatus("DISCONNECTED");

    await prisma.whatsAppSession.upsert({
      where: { sessionName: config.sessionName },
      update: {
        connectionStatus: "DISCONNECTED",
        authStatus: "UNAUTHENTICATED",
        phoneNumber: null,
        profileName: null,
        lastDisconnectedAt: new Date(),
      },
      create: {
        sessionName: config.sessionName,
        connectionStatus: "DISCONNECTED",
        authStatus: "UNAUTHENTICATED",
      },
    });

    // Remove local auth folder to force fresh QR
    try {
      if (fs.existsSync(config.authDir)) {
        fs.rmSync(config.authDir, { recursive: true, force: true });
        fs.mkdirSync(config.authDir, { recursive: true, mode: 0o700 });
      }
    } catch (e) {
      console.warn("Could not remove LocalAuth directory:", e);
    }
  }

  public registerSseClient(callback: (data: any) => void) {
    this.sseClients.add(callback);
    callback({
      type: "STATUS_CHANGE",
      status: this.currentStatus,
      qrCode: this.currentQr,
      error: this.lastError,
    });
  }

  public removeSseClient(callback: (data: any) => void) {
    this.sseClients.delete(callback);
  }

  public broadcast(data: any) {
    for (const client of this.sseClients) {
      try {
        client(data);
      } catch {
        this.sseClients.delete(client);
      }
    }
  }
}
