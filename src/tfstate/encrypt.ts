// Generate a key from the secret and encrypt the text using Web Crypto API
export default async function encrypt(
  text: string,
  secret: string,
): Promise<string> {
  // Import the secret as a key
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );

  // Derive a key using PBKDF2
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the text
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(text),
  );

  // Combine salt + iv + ciphertext into a single buffer
  const result = new Uint8Array(
    salt.length + iv.length + encryptedData.byteLength,
  );
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encryptedData), salt.length + iv.length);

  // Return as base64 string
  return btoa(String.fromCharCode(...result));
}
