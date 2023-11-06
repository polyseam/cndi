import { path } from "deps";
import getProjectRootDir from "get-project-root"; // this is the root of the project, runs on import (side-effect bad?)

export interface RunCndiResult {
  status: Deno.ProcessStatus;
  output: Uint8Array;
  stderror: Uint8Array;
}

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

async function runCndi(...args: string[]) {
  const decoder = new TextDecoder("utf-8");
  const lastIndex = args.length - 1;
  if (args[lastIndex] === "--loud") {
    args.pop();

    const cndiCommand = new Deno.Command(deno, {
      args: [...cmd, ...args],
      stdout: "inherit",
      stderr: "inherit",
    });

    const output = await cndiCommand.output();

    const status = {
      code: output.code,
      success: output.code === 0,
    };

    return { status };
  } else {
    const cndiCommand = new Deno.Command(deno, {
      args: [...cmd, ...args],
      stdout: "piped",
      stderr: "piped",
    });

    const output = await cndiCommand.output();

    const status = {
      code: output.code,
      success: output.code === 0,
    };

    console.log(decoder.decode(output.stdout));
    console.error(decoder.decode(output.stderr));

    return {
      status,
      output: decoder.decode(output.stdout),
      stderrOutput: decoder.decode(output.stderr),
    };
  }
}

async function runCndiLoud(...args: string[]) {
  const cndiCommand = new Deno.Command(deno, {
    args: [...cmd, ...args],
  });
  const output = await cndiCommand.output();
  const status = {
    code: output.code,
    success: output.code === 0,
  };
  return { status };
}

export { getRunningCNDIProcess, runCndi, runCndiLoud };
