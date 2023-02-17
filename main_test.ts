import { assert } from "https://deno.land/std@0.173.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.173.0/testing/bdd.ts";

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

describe("cndi", { permissions, sanitizeOps }, () => {
  describe("system", unclean, () => {
    it("should have a working test suite", () => {
      assert(true);
    });
  });
});
