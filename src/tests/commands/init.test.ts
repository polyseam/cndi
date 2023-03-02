import * as path from "https://deno.land/std@0.173.0/path/mod.ts";
import { assert } from "https://deno.land/std@0.173.0/testing/asserts.ts";
import {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.173.0/testing/bdd.ts";

import { basicCndiConfig, emptyCndiConfig } from "../mocks/cndiConfigs.ts";

import { getPrettyJSONString } from "src/utils.ts";

import { runCndi } from "../helpers/run-cndi.ts";
import { assertSetEquality } from "../helpers/util.ts";

beforeEach(() => {
  // initialize sandbox
  const dir = Deno.makeTempDirSync();
  Deno.chdir(dir);
});

describe("cndi init", () => {
  it("should fail if ./cndi-config.jsonc does not exist and interactive mode is disabled", async () => {
    const { status } = await runCndi("init");
    assert(!status.success);
  });

  it("should succeed if ./cndi-config.jsonc is valid", async () => {
    Deno.writeTextFileSync(
      path.join(Deno.cwd(), `cndi-config.jsonc`),
      getPrettyJSONString(basicCndiConfig),
    );
    const { status } = await runCndi("init");
    assert(status.success);
  });

  it("should fail if ./cndi-config.jsonc is invalid", async () => {
    Deno.writeTextFileSync(
      path.join(Deno.cwd(), `cndi-config.jsonc`),
      getPrettyJSONString(emptyCndiConfig),
    );
    const { status } = await runCndi("init");
    assert(!status.success);
  });

  it(`should create a README beginning with the "project_name" if a config file is supplied`, async () => {
    const project_name = "my-foo-project";
    Deno.writeTextFileSync(
      path.join(Deno.cwd(), `cndi-config.jsonc`),
      getPrettyJSONString({ ...basicCndiConfig, project_name }),
    );
    const { status } = await runCndi("init");
    assert(status.success);
    const readme = Deno.readTextFileSync(path.join(Deno.cwd(), `README.md`));
    assert(readme.startsWith(`# ${project_name}`));
  });

  it(`should throw an error if a config file is supplied without a "project_name"`, async () => {
    Deno.writeTextFileSync(
      path.join(Deno.cwd(), `cndi-config.jsonc`),
      getPrettyJSONString({ ...basicCndiConfig, project_name: undefined }),
    );

    const { status } = await runCndi("init");
    assert(!status.success);
  });

  it(`should throw an error if a config file is supplied with no nodes`, async () => {
    const nodelessCndiConfig = {
      ...basicCndiConfig,
      infrastructure: { cndi: { nodes: [] } },
    };
    Deno.writeTextFileSync(
      path.join(Deno.cwd(), `cndi-config.jsonc`),
      getPrettyJSONString(nodelessCndiConfig),
    );
    const { status } = await runCndi("init");
    assert(!status.success);
  });

  it(`should not add files or directories when it fails`, async () => {
    const originalContents = new Set<string>();
    // read the current directory entries (files, symlinks, and directories)
    for await (const dirEntry of Deno.readDir(".")) {
      originalContents.add(dirEntry.name);
    }
    // cndi init should fail because there is no config file
    const { status } = await runCndi("init");

    const afterContents = new Set<string>();
    // read the current directory entries after "cndi init" has ran
    for await (const afterDirEntry of Deno.readDir(".")) {
      afterContents.add(afterDirEntry.name);
    }
    assert(!status.success);
    assertSetEquality(originalContents, afterContents);
  });

  it(`should add correct files and directories when it succeeds`, async () => {
    const initFileList = new Set([
      "cndi-config.jsonc",
      "README.md",
      ".github",
      ".gitignore",
      ".env",
      ".vscode",
      "cndi",
    ]);

    Deno.writeTextFileSync(
      path.join(Deno.cwd(), `cndi-config.jsonc`),
      getPrettyJSONString(basicCndiConfig),
    );
    // cndi init should fail because there is no config file
    const { status } = await runCndi("init");

    // read the current directory entries after "cndi init" has ran
    for await (const afterDirEntry of Deno.readDir(".")) {
      initFileList.delete(afterDirEntry.name); // remove the file from the set if it exists
    }
    assert(initFileList.size === 0); // if the set is empty, all files were created
    assert(status.success);
  });
});
