export interface SignatureHeaders {
  "x-internal-api-key": string;
  "x-signature": string;
  "x-timestamp": string;
}

/**
 * Web Crypto (SubtleCrypto) implementation of HMAC-SHA256.
 * Works on both the Node.js (>=20) and the Cloudflare/Vercel Edge runtimes,
 * unlike Node's built-in "crypto" module which is unavailable on the Edge.
 */
async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Constant-time comparison of two hex strings to prevent timing attacks.
 */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Generates HMAC signature headers for requests between Next.js and Worker.
 */
export async function signInternalRequest(payload: any, secret: string, apiKey: string): Promise<SignatureHeaders> {
  const timestamp = String(Date.now());
  const bodyString = typeof payload === "string" ? payload : JSON.stringify(payload || {});
  const dataToSign = `${timestamp}.${bodyString}`;
  const signature = await hmacSha256Hex(secret, dataToSign);

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
export async function verifyInternalRequest(
  signature: string,
  timestamp: string,
  bodyString: string,
  secret: string,
  maxAgeMs: number = 5 * 60 * 1000
): Promise<boolean> {
  try {
    if (!signature || !timestamp || !secret) return false;

    const reqTime = parseInt(timestamp, 10);
    if (isNaN(reqTime)) return false;

    // Check for replay / expired timestamp
    if (Math.abs(Date.now() - reqTime) > maxAgeMs) {
      return false;
    }

    const dataToSign = `${timestamp}.${bodyString}`;
    const expectedSignature = await hmacSha256Hex(secret, dataToSign);

    return timingSafeEqualHex(expectedSignature, signature);
  } catch {
    return false;
  }
}
