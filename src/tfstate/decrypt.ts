import { ccolors, CryptoJS } from "deps";

const decryptLabel = ccolors.faded("\nsrc/tfstate/decrypt.ts:");

const decryptionError = new Error(
  [
    decryptLabel,
    ccolors.error("failed to decrypt tfstate file from your"),
    ccolors.key_name('"_state"'),
    ccolors.error("branch\n"),
    ccolors.warn(
      'your "TERRAFORM_STATE_PASSPHRASE" is likely incorrect, consider deleting your "_state" branch\n',
    ),
  ].join(" "),
  { cause: 1000 },
);

export default function decrypt(
  encryptedText: string,
  secret: string,
): string {
  // Special case: if the encrypted text is empty, return empty string
  if (encryptedText === "") {
    return "";
  }

  // Handle our special marker for empty strings
  if (encryptedText === "__EMPTY__") {
    return "";
  }

  const decrypted = CryptoJS.AES.decrypt(
    encryptedText,
    secret,
  );

  try {
    const str = decrypted.toString(CryptoJS.enc.Utf8);

    // For non-empty encrypted text, if decryption results in empty string,
    // it's likely due to an incorrect secret
    if (str === "" && encryptedText !== "") {
      throw decryptionError;
    }

    return str;
  } catch {
    throw decryptionError;
  }
}
