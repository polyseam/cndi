import { CryptoJS } from "deps";

export default (input: string, secret: string) =>
  CryptoJS.AES.encrypt(input || "_EMPTY_", secret).toString();
