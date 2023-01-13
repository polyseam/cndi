import { assert } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { crypto } from "https://deno.land/std@0.171.0/crypto/mod.ts";
import { describe, it } from "https://deno.land/std@0.171.0/testing/bdd.ts";

import cndi from "./src/cndi.ts";
import * as path from "https://deno.land/std@0.157.0/path/mod.ts";
import { homedir } from "https://deno.land/std@0.171.0/node/os.ts";

function digestMessage(message: string) {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = crypto.subtle.digestSync("SHA-256", msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
}

const permissions = {
  env: true,
  net: true,
  read: true,
  run: true,
  write: true,
};

const sanitizeOps = false; // this seems to be necessary, but it shouldn't be. sanitizeOps checks for unfinished operations like fs reads and writes
const sanitizeResources = false; // this seems to be necessary, but it shouldn't be. sanitizeResources checks for open resources like file handles

const unclean = {
  sanitizeOps,
  sanitizeResources,
};

const getWorkingDirPath = (commandId: string): string =>
  path.join(homedir() || "~", ".cndi", commandId);

// use "cndi" command in a unique directory by hashing the command to test
const executeCndi = async (command: string) => {
  const commandId = digestMessage(command);
  const workingDirPath = getWorkingDirPath(commandId);
  console.log(`Executing command: ${command} in directory: ${workingDirPath}`);
  const [, ...args] = command.split(" ");
  await cndi(args);
};

describe("cndi", { permissions, sanitizeOps }, () => {
  describe("system", unclean, () => {
    it("should have a working test suite", () => {
      assert(true);
    });
  });

  describe(`"cndi init -t aws/airflow-tls"'`, unclean, async () => {
    const command = "cndi init -t aws/airflow-tls";
    const commandId = digestMessage(command);
    const workingDir = getWorkingDirPath(commandId);

    try {
      Deno.removeSync(workingDir, { recursive: true });
    } catch {
      /* no folder to remove */
    }
    Deno.mkdirSync(workingDir);
    Deno.chdir(workingDir);
    console.log("Deno.cwd", Deno.cwd());

    await executeCndi(command);

    describe("generated README.md", unclean, () => {
      it("should be generated for the user", unclean, async () => {
        const readme = await Deno.readTextFile(
          path.join(workingDir, "README.md"),
        );
        assert(readme);
      });

      it('should contain the "deployment_target" name', unclean, async () => {
        const readme = await Deno.readTextFile(
          path.join(workingDir, "README.md"),
        );
        assert(readme.includes("aws"));
      });
    });

    it("should create a .gitignore file", unclean, async () => {
      const gitignore = await Deno.readTextFile(
        path.join(workingDir, ".gitignore"),
      );
      assert(gitignore);
    });

    it('should create a "cndi/terraform" directory', unclean, async () => {
      const terraformDir = await Deno.readDir(
        path.join(workingDir, "cndi", "terraform"),
      );
      assert(terraformDir);
    });

    it(
      'should create a "cndi/cluster_manifests" directory',
      unclean,
      async () => {
        const clusterManifestsDir = await Deno.readDir(
          path.join(workingDir, "cndi", "cluster_manifests"),
        );
        assert(clusterManifestsDir);
      },
    );
  });
});
