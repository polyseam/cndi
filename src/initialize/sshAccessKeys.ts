import { path } from "deps";
import { getPathToOpenSSHForPlatform } from "src/utils.ts";

const createSSHAccessKeys = async (
  outputDir: string,
): Promise<string> => {
  const pathToOpenSSH = getPathToOpenSSHForPlatform();

  const ssh_access_private_key_path = path.join(outputDir, "ssh_access_key");

  const ssh_access_public_key_path = path.join(outputDir, "ssh_access_key.pub");
  let ssh_access_public_key;

  const openSSHGenerateKeyPairCommand = new Deno.Command(pathToOpenSSH, {
    args: [
      "-t",
      "rsa",
      "-b",
      "4096",
      "-C",
      "ssh-access",
      "-f",
      ssh_access_private_key_path,
      "-q",
      "-N",
      '""',
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const openSSHGenerateKeyPairCommandOutput =
    await openSSHGenerateKeyPairCommand.output();

  if (openSSHGenerateKeyPairCommandOutput.code !== 0) {
    Deno.stdout.write(openSSHGenerateKeyPairCommandOutput.stderr);
    Deno.exit(252); // arbitrary exit code
  } else {
    // read in the .pub file then delete it
    ssh_access_public_key = await Deno.readTextFile(ssh_access_public_key_path);
    Deno.removeSync(ssh_access_public_key_path);
    // add .pem suffix to private key file so it's purpose is more obvious
    Deno.renameSync(
      ssh_access_private_key_path,
      ssh_access_private_key_path + ".pem",
    );
  }

  return ssh_access_public_key;
};

const loadSSHAccessPublicKey = (): string | null => {
  const ssh_access_public_key = Deno.env.get("SSH_ACCESS_PUBLIC_KEY") as string;
  if (!ssh_access_public_key) {
    return null;
  }
  return ssh_access_public_key;
};

export { createSSHAccessKeys, loadSSHAccessPublicKey };
