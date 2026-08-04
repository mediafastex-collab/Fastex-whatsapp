import path from "path";

export const config = {
  port: parseInt(process.env.WORKER_PORT || "4000", 10),
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  internalApiKey: process.env.INTERNAL_API_KEY || "fastex_internal_secret_key_2026",
  authDir: process.env.WHATSAPP_AUTH_DIR || path.resolve(process.cwd(), ".wwebjs_auth"),
  sessionName: "main-business-whatsapp",
  workerId: process.env.WORKER_INSTANCE_ID || `worker_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  isProduction: process.env.NODE_ENV === "production",
};
