import { ccolors, CryptoJS } from "deps";

const decryptLabel = ccolors.faded("\nsrc/tfstate/decrypt.ts:");

export default function decrypt(encryptedText: string, secret: string) {
  try {
    const decryptedString = CryptoJS.AES.decrypt(
      encryptedText,
      secret,
    ).toString(CryptoJS.enc.Utf8);
    return decryptedString;
  } catch (decryptError) {
    console.error(
      decryptLabel,
      ccolors.error("failed to decrypt tfstate file from your"),
      ccolors.key_name('"_state"'),
      ccolors.error("branch\n"),
    );

    console.log(
      decryptLabel,
      ccolors.warn(
        'your "TERRAFORM_STATE_PASSPHRASE" is likely incorrect, consider deleting your "_state" branch\n',
      ),
    );
    ccolors.caught(decryptError);
    Deno.exit(1);
  }
}
