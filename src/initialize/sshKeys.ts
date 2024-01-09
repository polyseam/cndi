import { path } from "deps";
import { SshKeys } from "src/types.ts";

const createSshKeys = async (outputDir: string): Promise<SshKeys> => {
  const pathToKeys = path.join(outputDir, ".keys");
  await Deno.mkdir(pathToKeys, { recursive: true });
  const ssh_private_key_path = path.join(pathToKeys, "cndi_rsa");
  const ssh_public_key_path = path.join(pathToKeys, "cndi_rsa.pub");

  let ssh_private_key;
  let ssh_public_key;

  const sshKeygenGenerateKeyPairCommand = new Deno.Command("ssh-keygen", {
    args: [
      "-t",
      "rsa",
      "-b",
      "4096",
      "-C",
      "bot@cndi.dev",
      "-f",
      ssh_private_key_path,
      "-N",
      "",
      "-q",
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const sshKeygenGenerateKeyPairCommandOutput =
    await sshKeygenGenerateKeyPairCommand.output();

  if (sshKeygenGenerateKeyPairCommandOutput.code !== 0) {
    Deno.stdout.write(sshKeygenGenerateKeyPairCommandOutput.stderr);
    Deno.exit(251); // arbitrary exit code
  } else {
    ssh_private_key = await Deno.readTextFile(
      ssh_private_key_path,
    );
    ssh_public_key = await Deno.readTextFile(
      ssh_public_key_path,
    );
    Deno.removeSync(pathToKeys, { recursive: true });
  }

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
