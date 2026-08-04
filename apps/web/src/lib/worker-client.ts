import { signInternalRequest } from "@fastex/shared";

const WORKER_URL = process.env.WORKER_URL || "http://localhost:4000";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "fastex_internal_secret_key_2026";

export async function callWorkerApi<T = any>(endpoint: string, options: { method?: string; body?: any } = {}): Promise<T> {
  const method = options.method || "GET";
  const bodyString = options.body ? JSON.stringify(options.body) : "";

  const headers = signInternalRequest(options.body || {}, INTERNAL_API_KEY, INTERNAL_API_KEY);

  const res = await fetch(`${WORKER_URL}/api/internal/whatsapp${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": headers["x-internal-api-key"],
      "x-signature": headers["x-signature"],
      "x-timestamp": headers["x-timestamp"],
    },
    body: method !== "GET" && method !== "HEAD" ? bodyString : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errMsg = "Worker API error";
    try {
      const parsed = JSON.parse(errorText);
      errMsg = parsed.error || errMsg;
    } catch {
      errMsg = errorText || errMsg;
    }
    throw new Error(errMsg);
  }

  return await res.json();
}
