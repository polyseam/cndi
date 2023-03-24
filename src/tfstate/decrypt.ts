import { ccolors, CryptoJS } from "deps";
import { emitExitEvent } from "src/utils.ts";

const decryptLabel = ccolors.faded("\nsrc/tfstate/decrypt.ts:");

export default async function decrypt(
  encryptedText: string,
  secret: string,
): Promise<string> {
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
    console.log(ccolors.caught(decryptError));
    await emitExitEvent(1000);
    Deno.exit(1000);
  }
}
