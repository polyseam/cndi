import { CryptoJS } from "../deps.ts";
import { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/colors.ts";

const decryptLabel = colors.white("tfstate/decrypt:");

export default function decrypt(encryptedText: string, secret: string) {
  try {
    const decryptedString = CryptoJS.AES.decrypt(
      encryptedText,
      secret,
    ).toString(CryptoJS.enc.Utf8);
    return decryptedString;
  } catch {
    console.log(
      decryptLabel,
      colors.brightRed("failed to decrypt tfstate file from your"),
      colors.cyan('"_state"'),
      colors.brightRed("branch\n"),
    );
    console.log(
      decryptLabel,
      colors.yellow(
        'your "TERRAFORM_STATE_PASSPHRASE" is likely incorrect, consider deleting your "_state" branch\n',
      ),
    );
    Deno.exit(1);
  }
}
