import { createServer } from "./api/server";
import { WhatsAppManager } from "./whatsapp/client";
import { startMessageWorker } from "./queue/bull-queue";
import { config } from "./config/env";

async function main() {
  console.log("=========================================");
  console.log(" Starting Fastex WhatsApp Worker Service ");
  console.log("=========================================");
  console.log(`Instance ID : ${config.workerId}`);
  console.log(`Port        : ${config.port}`);
  console.log(`Auth Dir    : ${config.authDir}`);

  // 1. Start Express Server
  const app = createServer();
  const server = app.listen(config.port, () => {
    console.log(`WhatsApp Worker API server listening on port ${config.port}`);
  });

  // 2. Start BullMQ Queue Worker
  startMessageWorker();
  console.log("BullMQ Message Queue Worker started.");

  // 3. Initialize WhatsApp Client (checks redis lock first)
  try {
    const manager = WhatsAppManager.getInstance();
    await manager.initialize();
  } catch (err: any) {
    console.error("Could not automatically initialize WhatsApp client on startup:", err.message);
  }

  // Graceful shutdown
  const shutdown = () => {
    console.log("Shutting down WhatsApp worker service...");
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("Fatal worker startup error:", err);
  process.exit(1);
});
