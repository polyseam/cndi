import { CryptoJS } from "deps";

export default function encrypt(text: string, secret: string): string {
  // Special case: if the text is empty, return a special marker
  if (text === "") {
    return "__EMPTY__";
  }
  return CryptoJS.AES.encrypt(text, secret).toString();
}
