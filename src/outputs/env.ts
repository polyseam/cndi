import { EnvCommentEntry, EnvLines, EnvValueEntry } from "src/types.ts";

const PLACEHOLDER_SUFFIX = "_PLACEHOLDER__";

const writeEnvObject = (envLines: EnvLines): string => {
  const dotEnvString = envLines.map((line) => {
    const commentLine = line as EnvCommentEntry;
    const valueLine = line as EnvValueEntry;

    if (commentLine?.comment) {
      return `\n# ${commentLine.comment}`;
    } else if (valueLine?.value) {
      const key = Object.keys(valueLine.value)[0];

      const val = valueLine?.value?.[key]
        ? valueLine.value[key]
        : `${key}${PLACEHOLDER_SUFFIX}`;

      Deno.env.set(key, val);

      return `${key}='${val}'`;
    } else {
      console.error("failed to build env file line", line);
      return "";
    }
  }).join("\n").trim();

  return dotEnvString + "\n";
};

export default writeEnvObject;
