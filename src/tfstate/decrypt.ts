import { ccolors } from "deps";

const decryptLabel = ccolors.faded("\nsrc/tfstate/decrypt.ts:");

export default async function decrypt(
  encryptedText: string,
  secret: string,
): Promise<string> {
  try {
    // Convert base64 string to Uint8Array
    const binaryString = atob(encryptedText);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Extract salt (first 16 bytes), iv (next 12 bytes), and ciphertext (the rest)
    const salt = bytes.slice(0, 16);
    const iv = bytes.slice(16, 28);
    const ciphertext = bytes.slice(28);

    // Import the secret as a key
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"],
    );

    // Derive the key using PBKDF2
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
      ["decrypt"],
    );

    // Decrypt the ciphertext
    const decryptedData = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );

    // Convert the decrypted data to a string
    return new TextDecoder().decode(decryptedData);
  } catch (_error) {
    throw new Error(
      [
        decryptLabel,
        ccolors.error("failed to decrypt tfstate file from your"),
        ccolors.key_name('"_state"'),
        ccolors.error(" branch\n"),
        ccolors.warn(
          'your "TERRAFORM_STATE_PASSPHRASE" is likely incorrect, consider deleting your "_state" branch\n',
        ),
      ].join(" "),
      { cause: 1000 },
    );
  }
}
