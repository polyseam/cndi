import { EDGE_RUNTIME_VERSION } from "consts";

export function getFunctionsDockerfileContent(version = EDGE_RUNTIME_VERSION) {
  return `
FROM ghcr.io/supabase/edge-runtime:v${version}

COPY ./src /home/deno/functions
WORKDIR /home/deno/functions
CMD [ "start", "--main-service", "/home/deno/functions/main" ]
`.trim();
}
