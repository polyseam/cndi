import {
  assert,
  assertEquals,
  assertNotEquals,
  assertRejects,
} from "@std/assert";

import encrypt from "./encrypt.ts";
import decrypt from "./decrypt.ts";

const TEST_SECRET = "test-secret-123";

Deno.test("encrypt and decrypt roundtrip works correctly", async () => {
  const originalText = "This is a test message";

  const encrypted = await encrypt(originalText, TEST_SECRET);
  const decrypted = await decrypt(encrypted, TEST_SECRET);

  assert(encrypted);
  assertNotEquals(
    encrypted,
    originalText,
    "Encrypted text should not match original",
  );
  assertEquals(decrypted, originalText, "Decrypted text should match original");
});

Deno.test("encrypt produces different outputs for same input", async () => {
  const text = "Same input text";

  const encrypted1 = await encrypt(text, TEST_SECRET);
  const encrypted2 = await encrypt(text, TEST_SECRET);

  assertNotEquals(
    encrypted1,
    encrypted2,
    "Encrypting the same text twice should produce different outputs due to random salt and IV",
  );

  // Both should still decrypt to the same text
  assertEquals(await decrypt(encrypted1, TEST_SECRET), text);
  assertEquals(await decrypt(encrypted2, TEST_SECRET), text);
});

Deno.test("decrypt throws error with wrong secret", async () => {
  const originalText = "Sensitive data";
  const encrypted = await encrypt(originalText, TEST_SECRET);

  await assertRejects(
    () => decrypt(encrypted, "wrong-secret"),
    Error,
    "failed to decrypt tfstate file from your",
  );
});

Deno.test("encrypt and decrypt handle empty string", async () => {
  const originalText = "";

  const encrypted = await encrypt(originalText, TEST_SECRET);
  const decrypted = await decrypt(encrypted, TEST_SECRET);

  assertEquals(decrypted, originalText, "Should handle empty string correctly");
});
