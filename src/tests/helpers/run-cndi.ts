import { path } from "deps";
import getProjectRootDir from "get-project-root"; // this is the root of the project, runs on import (side-effect bad?)

const deno = "deno";

const cmd = [
  "run",
  "--allow-all",
  path.join(getProjectRootDir(), "main.ts"),
];

function getRunningCNDIProcess(...args: string[]): Deno.ChildProcess {
  const cndiCommand = new Deno.Command(deno, {
    args: [...cmd, ...args],
    stdout: "piped",
    stderr: "piped",
    stdin: "piped",
  });

  return cndiCommand.spawn();
}

export type RunCndiOptions = {
  args: string[];
  cwd: string;
  loud?: boolean;
};

async function runCndi({ args, cwd, loud = false }: RunCndiOptions) {
  const decoder = new TextDecoder("utf-8");
  if (loud) {
    const cndiCommand = new Deno.Command(deno, {
      args: [...cmd, ...args],
      stdout: "piped",
      stderr: "piped",
      cwd,
    });

    const output = await cndiCommand.output();

    const status = {
      code: output.code,
      success: output.code === 0,
    };

    const outputStr = decoder.decode(output.stdout);
    const stderrOutputStr = decoder.decode(output.stderr);

    if (outputStr) console.log(outputStr);
    if (stderrOutputStr) console.error(stderrOutputStr);

    return {
      status,
      output: outputStr,
      stderrOutput: stderrOutputStr,
    };
  } else {
    const cndiCommand = new Deno.Command(deno, {
      args: [...cmd, ...args],
      stdout: "piped",
      stderr: "piped",
      cwd,
    });

    const output = await cndiCommand.output();

    const status = {
      code: output.code,
      success: output.code === 0,
    };

    return {
      status,
      output: decoder.decode(output.stdout),
      stderrOutput: decoder.decode(output.stderr),
    };
  }
}

export { getRunningCNDIProcess, runCndi };
