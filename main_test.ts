import { assert } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { crypto } from "https://deno.land/std@0.171.0/crypto/mod.ts";
import {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.171.0/testing/bdd.ts";

import cndi from "./src/cndi.ts";
import * as path from "https://deno.land/std@0.157.0/path/mod.ts";
import { homedir } from "https://deno.land/std@0.171.0/node/os.ts";

const previouswd = Deno.cwd();

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

// use "cndi" command in a unique directory by hashing the command to test
const executeCndi = async (command: string) => {
  const commandId = digestMessage(command);
  console.log(`Executing command: ${command} in directory: ${commandId}`);
  const [, ...args] = command.split(" ");
  const workingDir = path.join(homedir() || "~", ".cndi", commandId);
  try {
    Deno.removeSync(workingDir, { recursive: true });
  } catch {
    // ignore
  }
  Deno.mkdirSync(workingDir, { recursive: true });
  Deno.chdir(workingDir);
  await cndi(args);
};

describe("cndi", { permissions, sanitizeOps }, () => {
  beforeEach(() => {
    console.log("Restoring working directory to: ", previouswd);
    Deno.chdir(previouswd as string);
  });

  describe("system", unclean, () => {
    it("should have a working test suite", () => {
      assert(true);
    });
  });

  describe(`"cndi init -t aws/airflow-tls"'`, unclean, async () => {
    await executeCndi("cndi init -t aws/airflow-tls");

    describe("generated README.md", unclean, () => {
      it("should be generated for the user", unclean, async () => {
        const readme = await Deno.readTextFile("README.md");
        assert(readme);
      });

      it('should contain the "deployment_target" name', unclean, async () => {
        const readme = await Deno.readTextFile("README.md");
        assert(readme.includes("aws"));
      });
    });

    it("should create a .gitignore file", unclean, async () => {
      const gitignore = await Deno.readTextFile(".gitignore");
      assert(gitignore);
    });

    it('should create a "cndi/terraform" directory', unclean, async () => {
      const terraformDir = await Deno.readDir("cndi/terraform");
      assert(terraformDir);
    });

    it(
      'should create a "cndi/cluster_manifests" directory',
      unclean,
      async () => {
        const clusterManifestsDir = await Deno.readDir(
          "cndi/cluster_manifests",
        );
        assert(clusterManifestsDir);
      },
    );
  });

  describe(`"cndi init -t gcp/airflow-tls"'`, unclean, async () => {
    await executeCndi("cndi init -t gcp/airflow-tls");

    describe("generated README.md", unclean, () => {
      it("should be generated for the user", unclean, async () => {
        const readme = await Deno.readTextFile("README.md");
        assert(readme);
      });

      it('should contain the "deployment_target" name', unclean, async () => {
        const readme = await Deno.readTextFile("README.md");
        assert(readme.includes("gcp"));
      });
    });

    it("should create a .gitignore file", unclean, async () => {
      const gitignore = await Deno.readTextFile(".gitignore");
      assert(gitignore);
    });

    it('should create a "cndi/terraform" directory', unclean, async () => {
      const terraformDir = await Deno.readDir("cndi/terraform");
      assert(terraformDir);
    });

    it(
      'should create a "cndi/cluster_manifests" directory',
      unclean,
      async () => {
        const clusterManifestsDir = await Deno.readDir(
          "cndi/cluster_manifests",
        );
        assert(clusterManifestsDir);
      },
    );
  });
});
