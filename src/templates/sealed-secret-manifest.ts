import { CNDIContext, KubernetesSecret } from "../types.ts";
import { getPrettyJSONString } from "../utils.ts";

const getSealedSecretManifest = async (
  secret: KubernetesSecret,
  { pathToKubeseal, pathToKeys }: CNDIContext,
): Promise<string> => {
  let sealed = "";
  const secretPath = await Deno.makeTempFile();

  await Deno.writeTextFile(secretPath, getPrettyJSONString(secret), {
    create: true,
    mode: 0o777,
  });

  const pathToCert = `${pathToKeys}/cert.pem`;

  const cmd = [
    pathToKubeseal,
    `--cert=${pathToCert}`,
    `--secret-file=${secretPath}`,
  ];

  const ranKubeseal = Deno.run({
    cmd,
    stdout: "piped",
    stderr: "piped",
    stdin: "piped",
  });

  const ranKubesealStatus = await ranKubeseal.status();
  const ranKubesealOutput = await ranKubeseal.output();
  const ranKubesealStderr = await ranKubeseal.stderrOutput();

  if (ranKubesealStatus.code !== 0) {
    console.log("kubeseal failed");
    Deno.stdout.write(ranKubesealStderr);
    Deno.exit(332); // arbitrary exit code
  } else {
    // Deno.stdout.write(ranKubesealOutput);
    sealed = new TextDecoder().decode(ranKubesealOutput);
  }
  return sealed;
};

export default getSealedSecretManifest;
