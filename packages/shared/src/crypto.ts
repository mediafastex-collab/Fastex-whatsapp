import { createHmac, timingSafeEqual } from "crypto";

export interface SignatureHeaders {
  "x-internal-api-key": string;
  "x-signature": string;
  "x-timestamp": string;
}

/**
 * Generates HMAC signature headers for requests between Next.js and Worker.
 */
export function signInternalRequest(payload: any, secret: string, apiKey: string): SignatureHeaders {
  const timestamp = String(Date.now());
  const bodyString = typeof payload === "string" ? payload : JSON.stringify(payload || {});
  const dataToSign = `${timestamp}.${bodyString}`;
  const signature = createHmac("sha256", secret).update(dataToSign).digest("hex");

  return {
    "x-internal-api-key": apiKey,
    "x-signature": signature,
    "x-timestamp": timestamp,
  };
}

/**
 * Verifies the HMAC signature and timestamp of an incoming internal request.
 * Enforces a 5-minute window to prevent replay attacks.
 */
export function verifyInternalRequest(
  signature: string,
  timestamp: string,
  bodyString: string,
  secret: string,
  maxAgeMs: number = 5 * 60 * 1000
): boolean {
  try {
    if (!signature || !timestamp || !secret) return false;

    const reqTime = parseInt(timestamp, 10);
    if (isNaN(reqTime)) return false;

    // Check for replay / expired timestamp
    if (Math.abs(Date.now() - reqTime) > maxAgeMs) {
      return false;
    }

    const dataToSign = `${timestamp}.${bodyString}`;
    const expectedSignature = createHmac("sha256", secret).update(dataToSign).digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(signature, "hex");

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}
