import { Job } from "bullmq";
import { OutgoingJobData } from "@fastex/shared";
import { WhatsAppManager } from "../whatsapp/client";
import { prisma } from "@fastex/database";
import { config } from "../config/env";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function processMessageJob(job: Job<OutgoingJobData>): Promise<void> {
  const { messageId, recipientId, messageContent, idempotencyKey } = job.data;
  const manager = WhatsAppManager.getInstance();

  // 1. Check if WhatsApp worker is connected
  if (!manager.isReady()) {
    console.warn(`WhatsApp not ready. Delaying job ${job.id} for message ${messageId}...`);
    // Throw error so BullMQ retries after exponential backoff while offline
    throw new Error("WhatsApp client is not connected or ready");
  }

  // 2. Load WhatsAppMessage from DB
  const record = await prisma.whatsAppMessage.findUnique({
    where: { id: messageId },
  });

  if (!record) {
    throw new Error(`WhatsAppMessage record not found: ${messageId}`);
  }

  // 3. Idempotency Check: Do not resend if already sent
  if (record.status === "SENT" || record.status === "DELIVERED" || record.status === "READ" || record.status === "ACKNOWLEDGED") {
    console.log(`Message ${messageId} was already sent. Skipping duplicate send.`);
    return;
  }

  // 4. Update status to PROCESSING
  await prisma.whatsAppMessage.update({
    where: { id: messageId },
    data: {
      status: "PROCESSING",
      attemptCount: { increment: 1 },
    },
  });

  // 5. Check if number is registered on WhatsApp
  try {
    const isRegistered = await manager.checkNumberRegistered(recipientId);
    if (!isRegistered) {
      await prisma.whatsAppMessage.update({
        where: { id: messageId },
        data: {
          status: "FAILED",
          errorCode: "UNREGISTERED_NUMBER",
          errorMessage: "The mobile number is not registered on WhatsApp.",
          failedAt: new Date(),
        },
      });
      // Also update Lead if attached
      if (record.leadId) {
        await prisma.lead.update({
          where: { id: record.leadId },
          data: { isRegisteredOnWa: false },
        });
      }
      return;
    } else if (record.leadId) {
      await prisma.lead.update({
        where: { id: record.leadId },
        data: { isRegisteredOnWa: true },
      });
    }
  } catch (e: any) {
    console.warn("Could not verify WhatsApp registration status:", e.message);
  }

  // 6. Apply inter-message delay throttling
  const settings = await prisma.whatsAppSettings.findFirst();
  const minDelayMs = settings?.minDelayBetweenMs || 4000;
  await sleep(minDelayMs);

  // 7. Send WhatsApp message
  try {
    const waMsgId = await manager.sendWhatsAppMessage(recipientId, messageContent);

    // 8. Update DB on success
    await prisma.whatsAppMessage.update({
      where: { id: messageId },
      data: {
        status: "SENT",
        whatsappMessageId: waMsgId,
        sentAt: new Date(),
        errorMessage: null,
        errorCode: null,
      },
    });

    await prisma.whatsAppSession.upsert({
      where: { sessionName: config.sessionName },
      update: { lastSuccessfulMsgAt: new Date() },
      create: { sessionName: config.sessionName, lastSuccessfulMsgAt: new Date() },
    });

    manager.broadcast({
      type: "MESSAGE_SENT",
      messageId,
      whatsappMessageId: waMsgId,
      status: "SENT",
    });
  } catch (err: any) {
    console.error(`Failed to send WhatsApp message ${messageId}:`, err);
    await prisma.whatsAppMessage.update({
      where: { id: messageId },
      data: {
        status: "FAILED",
        errorCode: "SEND_FAILED",
        errorMessage: err.message || "Failed to send message via whatsapp-web.js",
        failedAt: new Date(),
      },
    });

    throw err;
  }
}
