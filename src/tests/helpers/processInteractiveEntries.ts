import { delay } from "deps";

// This object needs to be ordered, and the number of keys needs to be exactly the number of prompts
type InteractiveEntries = Record<string, string>;

type InteractiveProcess = Deno.Process<
  { stdout: "piped"; stdin: "piped"; stderr: "piped"; cmd: string[] }
>;

/**
 * Processes a list of inputs and writes them to a series of prompts
 * @param p The interactive Deno.Process with piped stdin, stdout, and stderr
 * @param entries An ordered object of entries to be written to the process' stdin
 * @returns status of the process after entries have been written
 */
export default async function processInteractiveEntries(
  p: InteractiveProcess,
  entries: InteractiveEntries,
  secondsBetweenEntries = 1,
) {
  const encoder = new TextEncoder();

  for (const [_, value] of Object.entries(entries)) {
    await p.stdin.write(encoder.encode(`${value}\n`));
    await delay(1000 * secondsBetweenEntries);
  }

  p.stdin.close();
  p.stdout.close();
  p.stderr.close();

  const status = await p.status();

  p.close();
  return status;
}
