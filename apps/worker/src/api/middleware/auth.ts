import { Request, Response, NextFunction } from "express";
import { verifyInternalRequest } from "@fastex/shared";
import { config } from "../../config/env";

export async function authenticateInternalApi(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKey = req.headers["x-internal-api-key"] as string;
  const signature = req.headers["x-signature"] as string;
  const timestamp = req.headers["x-timestamp"] as string;

  // 1. Check API Key
  if (!apiKey || apiKey !== config.internalApiKey) {
    res.status(401).json({ error: "Unauthorized: Invalid or missing X-Internal-API-Key header" });
    return;
  }

  // 2. In DEV/Test, if signature is "dev-bypass", allow for convenience in tests
  if (signature === "dev-bypass" || process.env.SKIP_HMAC_VERIFICATION === "true") {
    next();
    return;
  }

  // 3. Verify HMAC-SHA256 signature
  const bodyString = JSON.stringify(req.body || {});
  const isValid = await verifyInternalRequest(signature, timestamp, bodyString, config.internalApiKey);

  if (!isValid) {
    res.status(403).json({ error: "Forbidden: Invalid HMAC signature or expired request timestamp" });
    return;
  }

  next();
}
