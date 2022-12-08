import CryptoJS from "https://esm.sh/crypto-js@4.1.1";

export default function encrypt(text: string, secret: string) {
  const encryptedString = CryptoJS.AES.encrypt(text, secret).toString();
  return encryptedString;
}
