import { delay } from "deps";

// This object needs to be ordered, and the number of keys needs to be exactly the number of prompts
type InteractiveEntries = Record<string, string>;

/**
 * Processes a list of inputs and writes them to a series of prompts
 * @param p The interactive Deno.Process with piped stdin, stdout, and stderr
 * @param entries An ordered object of entries to be written to the process' stdin
 * @returns status of the process after entries have been written
 */
export default async function processInteractiveEntries(
  p: Deno.ChildProcess,
  entries: InteractiveEntries,
  secondsBetweenEntries = 1,
) {
  const INITIAL_WAIT = 1000;
  await delay(INITIAL_WAIT);
  const encoder = new TextEncoder();

  const wr = p.stdin.getWriter();

  for (const [_, value] of Object.entries(entries)) {
    const encoded = encoder.encode(`${value}\n`);
    await wr.write(encoded);
    await delay(1000 * secondsBetweenEntries);
  }

  wr.close();

  const output = await p.output();
  const status = {
    code: output.code,
    success: output.code === 0,
  };
  return status;
}
