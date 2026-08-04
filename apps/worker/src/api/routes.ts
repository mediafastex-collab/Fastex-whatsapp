import { Router, Request, Response } from "express";
import { WhatsAppManager } from "../whatsapp/client";
import { messageQueue } from "../queue/bull-queue";
import { normalizeMobileNumber, renderWhatsAppMessage } from "@fastex/shared";
import { prisma } from "@fastex/database";
import { authenticateInternalApi } from "./middleware/auth";

export const router: Router = Router();

// SSE Streaming Endpoint for Real-time QR and Status updates
router.get("/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const manager = WhatsAppManager.getInstance();

  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  manager.registerSseClient(sendEvent);

  req.on("close", () => {
    manager.removeSseClient(sendEvent);
  });
});

// Protect all internal JSON API routes
router.use(authenticateInternalApi);

// 1. Initialize client
router.post("/initialize", async (req: Request, res: Response) => {
  try {
    const manager = WhatsAppManager.getInstance();
    await manager.initialize();
    res.json({ success: true, status: manager.getStatus() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get connection status
router.get("/status", async (req: Request, res: Response) => {
  try {
    const manager = WhatsAppManager.getInstance();
    const status = manager.getStatus();

    const dbSession = await prisma.whatsAppSession.findUnique({
      where: { sessionName: "main-business-whatsapp" },
    });

    res.json({
      ...status,
      dbSession: dbSession || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Request QR code
router.post("/qr", async (req: Request, res: Response) => {
  try {
    const manager = WhatsAppManager.getInstance();
    const status = manager.getStatus();
    if (!status.qrCode) {
      // Trigger initialize if not started
      await manager.initialize();
    }
    res.json({ qrCode: manager.getStatus().qrCode, status: manager.getStatus().connectionStatus });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Restart client (restarts without removing LocalAuth session)
router.post("/restart", async (req: Request, res: Response) => {
  try {
    const manager = WhatsAppManager.getInstance();
    await manager.restart();
    res.json({ success: true, message: "WhatsApp client restarted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Logout client (logs out and deletes saved session)
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const manager = WhatsAppManager.getInstance();
    await manager.logout();
    res.json({ success: true, message: "WhatsApp account logged out and session destroyed" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Queue message
router.post("/queue-message", async (req: Request, res: Response) => {
  try {
    const { leadId, recipientNumber, messageContent, messageType = "AUTOMATIC_WELCOME", idempotencyKey } = req.body;

    if (!recipientNumber || !messageContent) {
      return res.status(400).json({ error: "recipientNumber and messageContent are required" });
    }

    const normalized = normalizeMobileNumber(recipientNumber);
    if (!normalized.isValid) {
      return res.status(400).json({ error: normalized.errorMessage });
    }

    // Idempotency check in DB
    if (idempotencyKey) {
      const existing = await prisma.whatsAppMessage.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return res.json({ success: true, messageId: existing.id, status: existing.status, duplicate: true });
      }
    }

    // Create WhatsAppMessage record in DB
    const createdMsg = await prisma.whatsAppMessage.create({
      data: {
        leadId: leadId || null,
        recipientNumber: normalized.normalizedNumber,
        messageContent,
        messageType: messageType as any,
        status: "QUEUED",
        idempotencyKey: idempotencyKey || undefined,
        queuedAt: new Date(),
      },
    });

    // Enqueue job to BullMQ
    const job = await messageQueue.add(
      "send-whatsapp-msg",
      {
        messageId: createdMsg.id,
        leadId: leadId || null,
        recipientNumber: normalized.normalizedNumber,
        recipientId: normalized.recipientId,
        messageContent,
        messageType,
        idempotencyKey: idempotencyKey || createdMsg.id,
        attemptCount: 0,
        scheduledAt: new Date().toISOString(),
      },
      {
        jobId: createdMsg.id,
      }
    );

    res.json({
      success: true,
      messageId: createdMsg.id,
      jobId: job.id,
      status: "QUEUED",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Send test message
router.post("/test-message", async (req: Request, res: Response) => {
  try {
    const { recipientNumber, customMessage } = req.body;
    if (!recipientNumber) {
      return res.status(400).json({ error: "recipientNumber is required" });
    }

    const normalized = normalizeMobileNumber(recipientNumber);
    if (!normalized.isValid) {
      return res.status(400).json({ error: normalized.errorMessage });
    }

    const settings = await prisma.whatsAppSettings.findFirst();
    const content = customMessage || renderWhatsAppMessage(settings?.defaultMessage || "Test message", {
      customer_name: "Test User",
      business_name: settings?.businessName || "Fastex",
    });

    // Create test message record
    const createdMsg = await prisma.whatsAppMessage.create({
      data: {
        recipientNumber: normalized.normalizedNumber,
        messageContent: content,
        messageType: "TEST",
        status: "QUEUED",
        queuedAt: new Date(),
      },
    });

    await messageQueue.add("send-whatsapp-test-msg", {
      messageId: createdMsg.id,
      recipientNumber: normalized.normalizedNumber,
      recipientId: normalized.recipientId,
      messageContent: content,
      messageType: "TEST",
      idempotencyKey: `test_${createdMsg.id}`,
      attemptCount: 0,
      scheduledAt: new Date().toISOString(),
    });

    res.json({ success: true, messageId: createdMsg.id, status: "QUEUED" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Check number
router.post("/check-number", async (req: Request, res: Response) => {
  try {
    const { recipientNumber } = req.body;
    const normalized = normalizeMobileNumber(recipientNumber);
    if (!normalized.isValid) {
      return res.status(400).json({ isValid: false, error: normalized.errorMessage });
    }

    const manager = WhatsAppManager.getInstance();
    let isRegistered = null;
    if (manager.isReady()) {
      isRegistered = await manager.checkNumberRegistered(normalized.recipientId);
    }

    res.json({
      isValid: true,
      normalizedNumber: normalized.normalizedNumber,
      recipientId: normalized.recipientId,
      isRegisteredOnWhatsApp: isRegistered,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Get worker health
router.get("/health", async (req: Request, res: Response) => {
  try {
    const manager = WhatsAppManager.getInstance();
    res.json({
      status: "OK",
      workerReady: manager.isReady(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ status: "ERROR", error: err.message });
  }
});

// 10. Get recent errors
router.get("/errors", async (req: Request, res: Response) => {
  try {
    const failedMessages = await prisma.whatsAppMessage.findMany({
      where: { status: "FAILED" },
      orderBy: { failedAt: "desc" },
      take: 20,
    });

    res.json({ errors: failedMessages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
