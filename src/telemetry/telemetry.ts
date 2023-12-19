import deno_json from "../../deno.json" assert { type: "json" };
import { sha256Digest } from "../utils.ts";

interface TelemetryEvent {
  eventName: string;
  cndi_binary_version: string;
  repo_id: string;
  repo_url?: string;
  debug: boolean;
  command: string;
}

const CNDI_TELEMETRY_URL = "https://cndi.run/events/telemetry";

export default async function emitTelemetryEvent(
  eventName: string,
  eventData: Record<string, unknown>,
) {
  const telemetryMode = Deno.env.get("CNDI_TELEMETRY")?.toLowerCase();

  if (telemetryMode === "none") return;

  let repo_url = Deno.env.get("GIT_REPO") || "";
  if (repo_url === "GIT_REPO_PLACEHOLDER__") repo_url = "";
  const repo_id = repo_url ? await sha256Digest(repo_url) : "";

  const telemetryEvent = {
    eventName,
    cndi_binary_version: deno_json?.version,
    repo_id,
    ...eventData,
  } as TelemetryEvent;

  telemetryEvent.command = Deno.args[1]; // eg. "run", "init", "ow" etc.

  if (telemetryMode !== "anonymous") {
    telemetryEvent.repo_url = repo_url;
    telemetryEvent.command = Deno.args.join(" ");
  }

  telemetryEvent.debug = telemetryMode === "debug";

  const response = await fetch(CNDI_TELEMETRY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(telemetryEvent),
  });

  return await response.text();
}
