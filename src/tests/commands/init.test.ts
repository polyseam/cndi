import * as path from "https://deno.land/std@0.173.0/path/mod.ts";
import { assert } from "https://deno.land/std@0.173.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.173.0/testing/bdd.ts";

import { basicCndiConfig } from "../mocks/cndiConfigs.ts";

const cndiCmd = [
  "deno",
  "run",
  "--allow-all",
  "--unstable",
  `${Deno.cwd()}/main.ts`,
];

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

describe("cndi init command", { permissions }, () => {
  describe("cndi init", () => {
    it("should fail if ./cndi-config.jsonc does not exist and interactive mode is disabled", async () => {
      const dir = Deno.makeTempDirSync();
      Deno.chdir(dir);
      const cmd = [...cndiCmd, "init"];
      const p = Deno.run({
        cmd,
      });
      const status = await p.status();
      assert(!status.success);
      p.close();
    });

    it("should succeed if ./cndi-config.jsonc is valid", async () => {
      const dir = Deno.makeTempDirSync();
      Deno.chdir(dir);

      Deno.writeTextFileSync(
        path.join(dir, `cndi-config.jsonc`),
        JSON.stringify(basicCndiConfig, null, 2),
      );

      const cmd = [...cndiCmd, "init"];
      const p = Deno.run({
        cmd,
      });
      const status = await p.status();
      assert(status.success);
      p.close();
    });
  });
});

// describe("cndi init command", { permissions }, () => {
//   describe("cndi init", () => {
//     it("should fail if ./cndi-config.jsonc does not exist and interactive mode is disabled", async () => {
//       const dir = Deno.makeTempDirSync();
//       Deno.chdir(dir);
//       const { cmd } = await cndi();
//       assertRejects(
//         async () => {
//           await cmd.parse(["init"]);
//         },
//         Error,
//         "Could not find cndi-config.jsonc",
//       );
//     });
//   });
// });
