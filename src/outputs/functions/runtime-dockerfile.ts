import { EDGE_RUNTIME_IMAGE_VERSION } from "versions";

export function getFunctionsDockerfileContent(
  version = EDGE_RUNTIME_IMAGE_VERSION,
) {
  return `
FROM ghcr.io/supabase/edge-runtime:v${version}

ENV OTEL_DENO=true

COPY ./src /home/deno/functions
WORKDIR /home/deno/functions
CMD [ "start", "--main-service", "/home/deno/functions/main" ]
`.trim();
}
