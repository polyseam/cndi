import { CryptoJS } from "deps";

/**
 * Encrypts the input string using AES encryption with the provided secret
 * @param input The string to encrypt
 * @param secret The secret key to use for encryption
 * @returns The encrypted string
 */
export default function encrypt(input: string, secret: string): string {
  return CryptoJS.AES.encrypt(input || "_EMPTY_", secret).toString();
}
