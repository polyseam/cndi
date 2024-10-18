import { ccolors, path, writeAll } from "deps";
import { getStagingDirectory, PxResult } from "src/utils.ts";

const sshKeysLabel = ccolors.faded("\nsrc/initialize/sshKeys.ts:");

type PublicKey = string;

const createSshKeys = async (): Promise<PxResult<PublicKey>> => {
  const [err, stagingDirectory] = getStagingDirectory();

  if (err) return [err];

  const ssh_private_key_path = path.join(stagingDirectory, "cndi_rsa");
  const ssh_public_key_path = path.join(stagingDirectory, "cndi_rsa.pub");

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
    await writeAll(Deno.stderr, sshKeygenGenerateKeyPairCommandOutput.stderr);
    console.error();
    throw new Error(
      [
        sshKeysLabel,
        "ssh-keygen failed to generate ssh keypair",
      ].join(" "),
      { cause: sshKeygenGenerateKeyPairCommandOutput.code },
    );
  } else {
    ssh_public_key = await Deno.readTextFile(
      ssh_public_key_path,
    );
    Deno.removeSync(ssh_public_key_path);
  }

  Deno.env.set("SSH_PUBLIC_KEY", ssh_public_key);

  return [undefined, ssh_public_key];
};

export { createSshKeys };
