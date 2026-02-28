import crypto from "crypto";

export function generateInputHash(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}
