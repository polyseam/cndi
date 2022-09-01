import * as base64 from "https://deno.land/std@0.152.0/encoding/base64.ts";

import jwkToPem, { JWK } from "https://esm.sh/jwk-to-pem@2.0.5";

const SSH_KEYGEN_ALGORITHM = "RSASSA-PKCS1-v1_5";
const SSH_KEYGEN_MODULUS_LENGTH = 2048;
const SSH_PUBLIC_EXPONENT = new Uint8Array([0x01, 0x00, 0x01]);
const SSH_KEYS_EXTRACTABLE = true;


const decodeFormattedBase64 = (encoded: string) => {
  return new Uint8Array(
    atob(encoded)
      .split("")
      .map((c) => c.charCodeAt(0)),
  );
};

const decodeRawBase64 = (input: string) => {
  try {
    return decodeFormattedBase64(
      input.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, ""),
    );
  } catch (_a) {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
};

export default async function createKeypair() {
  const { privateKey, publicKey } = await crypto.subtle.generateKey(
    {
      name: SSH_KEYGEN_ALGORITHM,
      modulusLength: SSH_KEYGEN_MODULUS_LENGTH,
      publicExponent: SSH_PUBLIC_EXPONENT,
      hash: { name: "SHA-256" },
    },
    SSH_KEYS_EXTRACTABLE,
    ["sign", "verify"],
  );

  const te = new TextEncoder();

  const publicKeyJWK = await crypto.subtle.exportKey("jwk", publicKey);
  const privateKeyJWK = await crypto.subtle.exportKey("jwk", privateKey);

  const modulus = decodeRawBase64(publicKeyJWK.n as string);

  // thedigitalcatonline.com/blog/2018/04/25/rsa-keys/#:~:text=The%20OpenSSH%20public%20key%20format,format%20is%20encoded%20with%20Base64.
  const publicKeyUint8Array = new Uint8Array([
    0x00,
    0x00,
    0x00,
    0x07, // length of "ssh-rsa" (next 0007 bytes)
    0x73, // "s"
    0x73, // "s"
    0x68, // "h"
    0x2d, // "-"
    0x72, // "r"
    0x73, // "s"
    0x61, // "a"
    0x00,
    0x00,
    0x00,
    0x03, // length of exponent (key.e) (next 3 bytes)
    0x01,
    0x00,
    0x01, // exponent (key.e)
    0x00, // length of modulus (key.n) (next 4 bytes)
    0x00,
    0x01,
    0x01,
    0x00, // bonus byte!
    ...modulus, // modulus (key.n)
  ]);

  const keyBody = base64.encode(publicKeyUint8Array);
  const publicKeyMaterial = te.encode(`ssh-rsa ${keyBody} user@host`);

  // this key is the string form of the private key file contents
  const privateKeyString = jwkToPem(privateKeyJWK as JWK, { private: true });
  // we want it in Uint8Array form for symmetry
  const privateKeyMaterial = te.encode(privateKeyString);

  return {
    publicKeyMaterial,
    privateKeyMaterial
  };
}
