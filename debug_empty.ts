import { CryptoJS } from "./src/deps.ts";

const secret = "test-secret";
const emptyText = "";

console.log("Testing empty string encryption/decryption...");

const encrypted = CryptoJS.AES.encrypt(emptyText, secret);
console.log("Encrypted string:", encrypted.toString());

const decrypted = CryptoJS.AES.decrypt(encrypted.toString(), secret);
console.log("Decrypted object words:", decrypted.words);
console.log("Decrypted object words length:", decrypted.words.length);
console.log("Decrypted string:", decrypted.toString(CryptoJS.enc.Utf8));
console.log(
  "Decrypted string length:",
  decrypted.toString(CryptoJS.enc.Utf8).length,
);

// Test with wrong password
console.log("\nTesting with wrong password...");
const wrongDecrypted = CryptoJS.AES.decrypt(
  encrypted.toString(),
  "wrong-password",
);
console.log("Wrong decrypted object words:", wrongDecrypted.words);
console.log(
  "Wrong decrypted object words length:",
  wrongDecrypted.words.length,
);
console.log(
  "Wrong decrypted string:",
  wrongDecrypted.toString(CryptoJS.enc.Utf8),
);
console.log(
  "Wrong decrypted string length:",
  wrongDecrypted.toString(CryptoJS.enc.Utf8).length,
);
