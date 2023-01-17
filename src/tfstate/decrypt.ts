import { CryptoJS } from "../deps.ts";

export default function decrypt(encryptedText: string, secret: string) {
  const decryptedString = CryptoJS.AES.decrypt(encryptedText, secret).toString(
    CryptoJS.enc.Utf8,
  );
  return decryptedString;
}
