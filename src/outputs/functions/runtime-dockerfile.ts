export function getFunctionsDockerfileContent(version = "v1.55.0") {
  return `
FROM ghcr.io/supabase/edge-runtime:${version}

COPY ./src /home/deno/functions
WORKDIR /home/deno/functions
CMD [ "start", "--main-service", "/home/deno/functions/main" ]
`.trim();
}
