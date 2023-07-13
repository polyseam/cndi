import { EnvLines } from "src/types.ts";

const getDevEnvLines = (): EnvLines => {
  return [
    { comment: "DEV" },
  ];
};

export { getDevEnvLines };
