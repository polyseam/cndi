import { ccolors, path, writeAll } from "deps";
import { getStagingDir } from "src/utils.ts";

const sshKeysLabel = ccolors.faded("\nsrc/initialize/sshKeys.ts:");

const createSshKeys = async (): Promise<string | null> => {
  const stagingDir = getStagingDir();

  const ssh_private_key_path = path.join(stagingDir, "cndi_rsa");
  const ssh_public_key_path = path.join(stagingDir, "cndi_rsa.pub");

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

  return ssh_public_key;
};

export { createSshKeys };
