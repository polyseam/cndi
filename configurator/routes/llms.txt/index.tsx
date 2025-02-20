import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET: (_req, _ctx) =>
    fetch("https://raw.githubusercontent.com/polyseam/cndi/main/llms.txt"),
};
