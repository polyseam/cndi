import { CryptoJS } from "../deps.ts";
import {
  brightRed,
  cyan,
  white,
  yellow,
} from "https://deno.land/std@0.173.0/fmt/colors.ts";

const decryptLabel = white("tfstate/decrypt:");

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
      brightRed("failed to decrypt tfstate file from your"),
      cyan('"_state"'),
      brightRed("branch\n"),
    );
    console.log(
      decryptLabel,
      yellow(
        'your "TERRAFORM_STATE_PASSPHRASE" is likely incorrect, consider deleting your "_state" branch\n',
      ),
    );
    Deno.exit(1);
  }
}
