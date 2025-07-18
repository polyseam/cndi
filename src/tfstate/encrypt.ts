import { CryptoJS } from "deps";

export default function encrypt(text: string, secret: string) {
  const encryptedString = CryptoJS.AES.encrypt(text, secret).toString();
  return encryptedString;
}
