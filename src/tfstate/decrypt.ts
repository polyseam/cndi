import CryptoJS from "https://esm.sh/crypto-js@4.1.1?bundle";

export default function decrypt(encryptedText: string, secret: string) {
  const decryptedString = CryptoJS.AES.decrypt(encryptedText, secret).toString(
    CryptoJS.enc.Utf8,
  );
  return decryptedString;
}
