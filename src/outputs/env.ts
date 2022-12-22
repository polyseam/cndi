import { EnvObject } from "../types.ts";

const PLACEHOLDER_SUFFIX = "_PLACEHOLDER__";

const writeEnvObject = async (
  pathToDotEnv: string,
  envObj: EnvObject,
): Promise<void> => {
  const dotEnvString = Object.keys(envObj)
    .map((key) => {
      const val = (
        envObj[key]?.value ? envObj[key].value : `${key}${PLACEHOLDER_SUFFIX}`
      ) as string;

      const comment = envObj[key]?.comment ? `\n# ${envObj[key].comment}` : "";

      Deno.env.set(key, val);

      return `${comment}\n${key}=${val}`;
    })
    .join("\n").trim();

  await Deno.writeTextFile(pathToDotEnv, dotEnvString + "\n");
};

export default writeEnvObject;
