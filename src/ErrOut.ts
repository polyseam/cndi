import { ccolors } from "deps";
import { emitTelemetryEvent } from "src/telemetry/telemetry.ts";
import { error_code_reference } from "consts";
import { OverwriteWorkerMessageOutgoing } from "src/actions/overwrite.worker.ts";

type Msg = Array<string> | string;

type ErrOutOptions = {
  code: number;
  metadata?: Record<string, unknown>;
  cause?: Error;
  id: string;
  label: string;
};

export class ErrOut extends Error {
  readonly cause?: never;
  readonly code: number;
  metadata: Record<string, unknown>;

  // a slash-delimitted path from '@org/module', 'fileName', 'functionName', 'condition'
  id: string;

  constructor(msg: Msg, options: ErrOutOptions) {
    const message = `${options.label}  ${
      Array.isArray(msg) ? msg.join(" ") : msg
    }`;
    super(message, { cause: options.cause });
    this.message = message;
    this.id = options.id;
    this.code = options.code;
    this.metadata = options.metadata || {};
  }

  get discussionURL(): string {
    return (
      error_code_reference.find((entry) => entry.code === this.code)
        ?.discussion_link || ""
    );
  }

  print(): void {
    console.error(this.message);
    const discussionMessage = this.discussionURL
      ? `discussion: ${ccolors.prompt(this.discussionURL)}`
      : "";
    console.error(discussionMessage);
  }

  toString(): string {
    const { id, message, code } = this;
    return [`Error: ${id}`, `code: ${code}`, message].join("\n");
  }

  async persist(): Promise<boolean> {
    const exit_code = this.code;
    try {
      const event_uuid = await emitTelemetryEvent("command_exit", {
        exit_code,
      });
      const isDebug = Deno.env.get("CNDI_TELEMETRY") === "debug";
      if (isDebug) console.log("\nevent_uuid", event_uuid + "\n");
      return true;
    } catch {
      return false;
    }
  }

  async out(): Promise<never> {
    this.print();
    try {
      await this.persist();
    } catch {
      // error persisting exit event to telemetry server
    }
    return this.exit();
  }

  get owWorkerErrorMessage() {
    return {
      type: "error-overwrite",
      code: this.code,
      message: this.message,
    } as OverwriteWorkerMessageOutgoing;
  }

  exit = () => Deno.exit(this.code);
}
