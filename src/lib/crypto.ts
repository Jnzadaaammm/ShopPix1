import crypto from "node:crypto";

const KEY = process.env.CREDENTIALS_ENCRYPTION_KEY;

function getKey(): Buffer {
  if (!KEY) {
    throw new Error("CREDENTIALS_ENCRYPTION_KEY não configurada");
  }
  if (KEY.length !== 64) {
    throw new Error("CREDENTIALS_ENCRYPTION_KEY deve ter 64 caracteres hex (32 bytes)");
  }
  return Buffer.from(KEY, "hex");
}

export function encryptCredential(plainText: string): { content: string; hash: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf-8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const hash = crypto.createHash("sha256").update(plainText).digest("hex");
  const content = Buffer.concat([iv, authTag, encrypted]).toString("base64");
  return { content, hash };
}

export function decryptCredential(content: string): string {
  const buffer = Buffer.from(content, "base64");
  const iv = buffer.subarray(0, 12);
  const authTag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf-8");
}

export function hashCredential(plainText: string): string {
  return crypto.createHash("sha256").update(plainText).digest("hex");
}
