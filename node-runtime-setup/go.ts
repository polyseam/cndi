const os = Deno.build.os;
import * as path from "https://deno.land/std@0.152.0/path/mod.ts";
const bootstrapNodeUsingBinary = async () => {
  const bootstrapBinaryDict = {
    darwin: "cndi-next-node-runtime-setup-macos-x64",
    linux: "cndi-next-node-runtime-setup-linux-x64",
    windows: "cndi-next-node-runtime-setup-windows-x64.exe",
  };

  const bootstrapBinaryPath = path.join(
    Deno.cwd(),
    "dist",
    bootstrapBinaryDict[os]
  );
  
  const privateKeyPath = path.join(Deno.cwd(), "..", "private.pem");
  const nodesPath = path.join(Deno.cwd(), "nodes.json");
  const bootstrapPath = path.join(Deno.cwd(), "..", "bootstrap");

  const cmd = [
    bootstrapBinaryPath,
    "-k",
    privateKeyPath,
    "-n",
    nodesPath,
    "-b",
    bootstrapPath,
  ];

  console.log("bootstrapping with binary", cmd);

  const p = Deno.run({
    cmd,
    stdout: "piped",
    stderr: "piped",
  });

  const { code } = await p.status();
  // Reading the outputs closes their pipes
  const rawOutput = await p.output();
  const rawError = await p.stderrOutput();

  if (code === 0) {
    // CNDI cluster deployed successfully
    await Deno.stdout.write(rawOutput);
  } else {
    const errorString = new TextDecoder().decode(rawError);
    console.log(errorString);
  }
};

export default bootstrapNodeUsingBinary;