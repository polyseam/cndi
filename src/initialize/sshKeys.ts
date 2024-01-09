import { path } from "deps";

const createSshKeys = async (outputDir: string): Promise<string> => {
  const ssh_private_key_path = path.join(outputDir, "cndi_rsa");
  const ssh_public_key_path = path.join(outputDir, "cndi_rsa.pub");

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
    ssh_public_key = await Deno.readTextFile(
      ssh_public_key_path,
    );
    Deno.removeSync(ssh_public_key_path);
  }

  Deno.env.set("SSH_PUBLIC_KEY", ssh_public_key);

  return ssh_public_key;
};

const loadSshPublicKey = (): string | null => {
  const ssh_public_key = Deno.env.get(
    "SSH_PUBLIC_KEY",
  ) as string;

  if (!ssh_public_key) {
    return null;
  }

  return ssh_public_key;
};

export { createSshKeys, loadSshPublicKey };
