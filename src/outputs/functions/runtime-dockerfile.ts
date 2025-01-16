import { EDGE_RUNTIME_IMAGE_TAG } from "versions";

export function getFunctionsDockerfileContent(
  version = EDGE_RUNTIME_IMAGE_TAG,
) {
  return `
FROM ghcr.io/supabase/edge-runtime:v${version}

COPY ./src /home/deno/functions
WORKDIR /home/deno/functions
CMD [ "start", "--main-service", "/home/deno/functions/main" ]
`.trim();
}
