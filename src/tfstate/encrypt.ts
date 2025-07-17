import { CryptoJS } from "deps";

export default function encrypt(input: string, secret: string): string {
  const text = input === "" ? "_EMPTY_" : input;
  return CryptoJS.AES.encrypt(text, secret).toString();
}
