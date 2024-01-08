import { silky } from "deps";

import { SshKeys } from "src/types.ts";

const createSshKeys = async (): Promise<SshKeys> => {
  const { publicKey, privateKey } = await silky.generateSelfSignedX509KeyPair(
    "CN=cndi-ssh, O=cndi-ssh",
  );

  const ssh_private_key = privateKey;
  const ssh_public_key = publicKey;

  Deno.env.set("SSH_PRIVATE_KEY", ssh_private_key);
  Deno.env.set("SSH_PUBLIC_KEY", ssh_public_key);

  return {
    ssh_private_key,
    ssh_public_key,
  };
};

const loadSshKeys = (): SshKeys | null => {
  const ssh_public_key = Deno.env.get(
    "SSH_PUBLIC_KEY",
  ) as string;

  const ssh_private_key = Deno.env.get(
    "SSH_PRIVATE_KEY",
  ) as string;

  if (!ssh_public_key) {
    return null;
  }

  if (!ssh_private_key) {
    return null;
  }

  const ssh = {
    ssh_private_key,
    ssh_public_key,
  };

  return ssh;
};

export { createSshKeys, loadSshKeys };
