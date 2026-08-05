import { describe, it } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import { encryptCredential, decryptCredential } from "./crypto";

describe("credential crypto", () => {
  it("encrypts and decrypts a credential", () => {
    const original = "user:admin;pass:123456";
    const key = crypto.randomBytes(32).toString("hex");
    process.env.CREDENTIALS_ENCRYPTION_KEY = key;

    const { content } = encryptCredential(original);
    const decrypted = decryptCredential(content);

    assert.strictEqual(decrypted, original);
    assert.notStrictEqual(content, original);
  });
});
