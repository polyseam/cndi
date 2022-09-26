import * as base64 from "https://deno.land/std@0.156.0/encoding/base64.ts";

import jwkToPem from "npm:jwk-to-pem@2.0.5";

// TODO: We should figure this transform out ourselves
import NodeRSA from "npm:node-rsa@1.1.1";

const SSH_KEYGEN_ALGORITHM = "RSASSA-PKCS1-v1_5";
const SSH_KEYGEN_MODULUS_LENGTH = 2048;
const SSH_PUBLIC_EXPONENT = new Uint8Array([0x01, 0x00, 0x01]);
const SSH_KEYS_EXTRACTABLE = true;

const KEY_NAME_PREFIX = "cndi-key-";

const decodeFormattedBase64 = (encoded: string) => {
  return new Uint8Array(
    atob(encoded)
      .split("")
      .map((c) => c.charCodeAt(0))
  );
};

const decodeRawBase64 = (input: string) => {
  try {
    return decodeFormattedBase64(
      input.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "")
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
    ["sign", "verify"]
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

  // though keyname is a comment according to the spec, our key name is saved in this section and consumed later
  const keyName = `${KEY_NAME_PREFIX}${keyBody.slice(-16)}`;

  // binary contents of the future public.pub file
  const publicKeyMaterial = te.encode(
    `ssh-rsa ${keyBody} ${keyName}`
  );

  // this private key is the string form of the private key file contents
  const privateKeyStringPKCS8 = jwkToPem(privateKeyJWK,  {
    private: true,
  });

  // we convert the above contents PKCS8 string into a PKCS1 string which has wider support
  const privateKeyString = new NodeRSA(privateKeyStringPKCS8).exportKey(
    "pkcs1-private-pem"
  );

  // we want it in Uint8Array form for symmetry
  const privateKeyMaterial = te.encode(privateKeyString);

  return {
    publicKeyMaterial,
    privateKeyMaterial,
  };
}
