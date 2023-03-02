import * as path from "https://deno.land/std@0.172.0/path/mod.ts";
const srcDir = Deno.cwd(); // this is the root of the project, runs on import (side-effect bad?)

const cmd = [
  "deno",
  "run",
  "--allow-all",
  "--unstable",
  path.join(srcDir, "main.ts"),
];

async function runCndi(...args: string[]) {
  const p = Deno.run({
    cmd: [...cmd, ...args],
    stdout: "piped",
    stderr: "piped",
  });

  const [status, output, stderror] = await Promise.all([
    p.status(),
    p.output(),
    p.stderrOutput(),
  ]);

  p.close();
  return { status, output, stderror };
}

export { runCndi };
