import { ccolors, CryptoJS } from "deps";

const decryptLabel = ccolors.faded("\nsrc/tfstate/decrypt.ts:");

export default function decrypt(
  encryptedText: string,
  secret: string,
): Promise<string> {
  try {
    const decryptedString = CryptoJS.AES.decrypt(
      encryptedText,
      secret,
    ).toString(CryptoJS.enc.Utf8);
    return decryptedString;
  } catch {
    throw new Error(
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
  }
}
