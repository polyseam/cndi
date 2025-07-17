import {
  assert,
  assertEquals,
  assertNotEquals,
  assertThrows,
} from "@std/assert";

import encrypt from "./encrypt.ts";
import decrypt from "./decrypt.ts";

const TEST_SECRET = "test-secret-123";

Deno.test("encrypt and decrypt roundtrip works correctly", () => {
  const originalText = "This is a test message";

  const encrypted = encrypt(originalText, TEST_SECRET);
  const decrypted = decrypt(encrypted, TEST_SECRET);

  assert(encrypted);
  assertNotEquals(
    encrypted,
    originalText,
    "Encrypted text should not match original",
  );
  assertEquals(decrypted, originalText, "Decrypted text should match original");
});

Deno.test("encrypt produces different outputs for same input", () => {
  const text = "Same input text";

  const encrypted1 = encrypt(text, TEST_SECRET);
  const encrypted2 = encrypt(text, TEST_SECRET);

  assertNotEquals(
    encrypted1,
    encrypted2,
    "Encrypting the same text twice should produce different outputs due to random salt and IV",
  );

  // Both should still decrypt to the same text
  assertEquals(decrypt(encrypted1, TEST_SECRET), text);
  assertEquals(decrypt(encrypted2, TEST_SECRET), text);
});

Deno.test("decrypt throws error with wrong secret", () => {
  const originalText = "Sensitive data";
  const encrypted = encrypt(originalText, "correct-secret");

  assertThrows(
    () => {
      decrypt(encrypted, "wrong-secret");
    },
  );
});

Deno.test("encrypt and decrypt handle empty string", () => {
  const originalText = "";

  const encrypted = encrypt(originalText, TEST_SECRET);
  const decrypted = decrypt(encrypted, TEST_SECRET);

  assertEquals(decrypted, originalText, "Should handle empty string correctly");
});
