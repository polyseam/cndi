import { homedir } from "https://deno.land/std@0.173.0/node/os.ts?s=homedir";
import {
  assert,
  assertRejects,
} from "https://deno.land/std@0.173.0/testing/asserts.ts";
import {
  beforeAll,
  describe,
  it,
} from "https://deno.land/std@0.173.0/testing/bdd.ts";
import cndi from "../cndi.ts";

const permissions = {
  env: true,
  net: true,
  read: true,
  run: true,
  write: true,
};

// const sanitizeOps = false; // this seems to be necessary, but it shouldn't be. sanitizeOps checks for unfinished operations like fs reads and writes
// const sanitizeResources = false; // this seems to be necessary, but it shouldn't be. sanitizeResources checks for open resources like file handles

// const unclean = {
//   sanitizeOps,
//   sanitizeResources,
// };

beforeAll(async () => {
  const testPath = `${homedir()}/.cndi`;
  await Deno.chdir();
});

describe("cndi init command", () => {
  describe("cndi init", () => {
    it("should fail if ./cndi-config.jsonc does not exist and interactive mode is disabled", async () => {
      const { cmd } = await cndi();
      assertRejects(
        async () => {
          await cmd.parse(["init"]);
        },
        Error,
        "Could not find cndi-config.jsonc",
      );
    });
  });
});
