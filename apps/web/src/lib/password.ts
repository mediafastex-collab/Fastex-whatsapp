// Web Crypto SHA-256 password hashing (Edge-compatible). Produces the same hex
// digest as the Node "crypto" createHash used by the database seed, so hashes
// created here are interchangeable with seeded credentials.
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password + "fastex_salt_2026");
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
