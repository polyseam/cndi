import { assert } from "test-deps";
import { path } from "deps";
import getCodebasePath from "../../../_here.ts";
import { useTemplate } from "src/templates/templates.ts";

import errorCodeReference from "../../../docs/error-code-reference.json" with {
  type: "json",
};

function getTemplatePath(name: string): string {
  return path.join(
    getCodebasePath(),
    "/src/tests/mocks/templates/",
    name,
  );
}

function assertTestCaseAttemptedToExitWithCode(
  error: string,
  targetCode: number,
) {
  // SEARCH_PREFIX is stapled to Deno's error message when a test case exits with a non-zero exit code
  const SEARCH_PREFIX = "Error: Test case attempted to exit with exit code:";
  const exitCodeStr = error.toString().split(SEARCH_PREFIX)[1].split(`\n`)[0];
  const exitCode = parseInt(exitCodeStr);
  assert(
    exitCode === targetCode,
    `Expected exit code ${targetCode} but got ${exitCode}`,
  );
}

function assertErrorCodeReferenceContainsCode(code: number) {
  assert(
    errorCodeReference.findIndex((error) => error.code === code) > -1,
    `Expected error code reference to contain code ${code}`,
  );
}

function assertOccurenceInStrings(strings: Array<string>, substring: string) {
  let foundOccurence = false;
  for (const string of strings) {
    if (string.includes(substring)) {
      foundOccurence = true;
    }
  }
  assert(foundOccurence, `Expected to find occurence of "${substring}"`);
}

Deno.env.set("CNDI_TELEMETRY", "debug");

Deno.test( // TODO: better message search; better exit_code;
  "template parsing should fail if a prompt is missing a name",
  async () => {
    // let dir = "";
    const pathToPromptMissingNameTemplate = getTemplatePath(
      "prompt_missing_name.yaml",
    );

    console.log(pathToPromptMissingNameTemplate);

    const originalConsoleLog = console.log;
    const loggedMessages: Array<string> = [];

    console.log = (...args) => {
      loggedMessages.push(args.join(" "));
      originalConsoleLog(...args);
    };

    try {
      await useTemplate(`file://${pathToPromptMissingNameTemplate}`, false);
    } catch (error) {
      assertOccurenceInStrings(loggedMessages, "prompt missing name");
      assertErrorCodeReferenceContainsCode(1);
      assertTestCaseAttemptedToExitWithCode(error, 1);
    } finally {
      console.log = originalConsoleLog;
    }
  },
);

Deno.test( // TODO: better message search; better exit_code;
  "template parsing should fail if a prompt has no type property",
  async () => {
    // let dir = "";
    const pathToPromptMissingTypeTemplate = getTemplatePath(
      "prompt_missing_type.yaml",
    );

    console.log(pathToPromptMissingTypeTemplate);

    const originalConsoleLog = console.log;
    const loggedMessages: Array<string> = [];

    console.log = (...args) => {
      loggedMessages.push(args.join(" "));
      originalConsoleLog(...args);
    };

    try {
      await useTemplate(`file://${pathToPromptMissingTypeTemplate}`, false);
    } catch (error) {
      assertOccurenceInStrings(loggedMessages, "prompt missing type");
      assertErrorCodeReferenceContainsCode(1);
      assertTestCaseAttemptedToExitWithCode(error, 1);
    } finally {
      console.log = originalConsoleLog;
    }
  },
);

Deno.test(
  "templates which call 'get_block(identifier)' in 'prompts' should insert the block in that location if and only if the block is an array",
  async () => {
    const pathToPromptGetBlockArrayTemplate = getTemplatePath(
      "prompts_get_block_array.yaml",
    );

    console.log(pathToPromptGetBlockArrayTemplate);

    const originalConsoleLog = console.log;
    const loggedMessages: Array<string> = [];

    console.log = (...args) => {
      loggedMessages.push(args.join(" "));
      originalConsoleLog(...args);
    };

    try {
      const result = await useTemplate(
        `file://${pathToPromptGetBlockArrayTemplate}`,
        false,
        {
          deployment_target_provider: "aws",
        },
      );
      console.log(result);
      assert(result);
    } catch (_error) {
      assert(false, "caught error when using get_block for prompts");
    } finally {
      console.log = originalConsoleLog;
    }
  },
);

// Deno.test(
//   "templates prompts marked as required should fail if the user does not provide a response in non-interactive mode",
//   async (t) => {
//     let dir = "";
//     await t.step("setup", async () => {
//       dir = await Deno.makeTempDir();
//       Deno.chdir(dir);
//     });

//     await t.step("test", async () => {
//       assert(false);
//     });

//     await t.step("cleanup", async () => {
//       Deno.chdir("..");
//       await Deno.remove(dir, { recursive: true });
//     });
//   },
// );

// Deno.test(
//   "template parsing should throw a useful error when 'get_prompt_response' fails to match a prompt",
//   async (t) => {
//     let dir = "";
//     await t.step("setup", async () => {
//       dir = await Deno.makeTempDir();
//       Deno.chdir(dir);
//     });

//     await t.step("test", async () => {
//       assert(false);
//     });

//     await t.step("cleanup", async () => {
//       Deno.chdir("..");
//       await Deno.remove(dir, { recursive: true });
//     });
//   },
// );

// Deno.test(
//   "template parsing should be able to fetch a 'block' from a local block declaration with 'content'",
//   async (t) => {
//     let dir = "";
//     await t.step("setup", async () => {
//       dir = await Deno.makeTempDir();
//       Deno.chdir(dir);
//     });

//     await t.step("test", async () => {
//       assert(false);
//     });

//     await t.step("cleanup", async () => {
//       Deno.chdir("..");
//       await Deno.remove(dir, { recursive: true });
//     });
//   },
// );

// Deno.test(
//   "template parsing should be able to fetch a 'block' from a local block declaration with 'content_url'",
//   async (t) => {
//     let dir = "";
//     await t.step("setup", async () => {
//       dir = await Deno.makeTempDir();
//       Deno.chdir(dir);
//     });

//     await t.step("test", async () => {
//       assert(false);
//     });

//     await t.step("cleanup", async () => {
//       Deno.chdir("..");
//       await Deno.remove(dir, { recursive: true });
//     });
//   },
// );

// Deno.test(
//   "template parsing should be able to populate a 'block' where the 'identifier' is computed at runtime",
//   async (t) => {
//     let dir = "";
//     await t.step("setup", async () => {
//       dir = await Deno.makeTempDir();
//       Deno.chdir(dir);
//     });

//     await t.step("test", async () => {
//       assert(false);
//     });

//     await t.step("cleanup", async () => {
//       Deno.chdir("..");
//       await Deno.remove(dir, { recursive: true });
//     });
//   },
// );

// Deno.test(
//   "templates which contain a '$cndi.comment(my_comment)' call in outputs.cndi_config should insert a comment in that location",
//   async (t) => {
//     let dir = "";
//     await t.step("setup", async () => {
//       dir = await Deno.makeTempDir();
//       Deno.chdir(dir);
//     });

//     await t.step("test", async () => {
//       assert(false);
//     });

//     await t.step("cleanup", async () => {
//       Deno.chdir("..");
//       await Deno.remove(dir, { recursive: true });
//     });
//   },
// );

// Deno.test(
//   "templates which contain a '$cndi.comment(my_comment)' call in outputs.env should insert a comment in that location",
//   async (t) => {
//     let dir = "";
//     await t.step("setup", async () => {
//       dir = await Deno.makeTempDir();
//       Deno.chdir(dir);
//     });

//     await t.step("test", async () => {
//       assert(false);
//     });

//     await t.step("cleanup", async () => {
//       Deno.chdir("..");
//       await Deno.remove(dir, { recursive: true });
//     });
//   },
// );

// Deno.test(
//   "templates which call 'get_block(identifier)' in outputs.cndi_config should insert the block in that location",
//   async (t) => {
//     let dir = "";
//     await t.step("setup", async () => {
//       dir = await Deno.makeTempDir();
//       Deno.chdir(dir);
//     });

//     await t.step("test", async () => {
//       assert(false);
//     });

//     await t.step("cleanup", async () => {
//       Deno.chdir("..");
//       await Deno.remove(dir, { recursive: true });
//     });
//   },
// );

// Deno.test(
//   "templates which call 'get_block(identifier)' in outputs.env should insert the block in that location if and only if it is a flat key/value map",
//   async (t) => {
//     let dir = "";
//     await t.step("setup", async () => {
//       dir = await Deno.makeTempDir();
//       Deno.chdir(dir);
//     });

//     await t.step("test", async () => {
//       assert(false);
//     });

//     await t.step("cleanup", async () => {
//       Deno.chdir("..");
//       await Deno.remove(dir, { recursive: true });
//     });
//   },
// );

// Deno.test(
//   `
//   templates which call get_block(a) conditionally alongside get_block(b)
//   with mutually exclusive conditions should insert the correct block in that location
// `.trim(),
//   async (t) => {
//     let dir = "";
//     await t.step("setup", async () => {
//       dir = await Deno.makeTempDir();
//       Deno.chdir(dir);
//     });

//     await t.step("test", async () => {
//       assert(false);
//     });

//     await t.step("cleanup", async () => {
//       Deno.chdir("..");
//       await Deno.remove(dir, { recursive: true });
//     });
//   },
// );

// Deno.test(
//   "templates should present an error if $cndi.get_arg(arg_name) is called inside a block without that arg supplied",
//   async (t) => {
//     let dir = "";
//     await t.step("setup", async () => {
//       dir = await Deno.makeTempDir();
//       Deno.chdir(dir);
//     });

//     await t.step("test", async () => {
//       assert(false);
//     });

//     await t.step("cleanup", async () => {
//       Deno.chdir("..");
//       await Deno.remove(dir, { recursive: true });
//     });
//   },
// );

// Deno.test(
//   "templates should be able to call 'get_prompt_response(prompt_name)' inside a block",
//   async (t) => {
//     let dir = "";
//     await t.step("setup", async () => {
//       dir = await Deno.makeTempDir();
//       Deno.chdir(dir);
//     });

//     await t.step("test", async () => {
//       assert(false);
//     });

//     await t.step("cleanup", async () => {
//       Deno.chdir("..");
//       await Deno.remove(dir, { recursive: true });
//     });
//   },
// );

// Deno.test(
//   "templates should present an error referencing the block identifier if it attempts to call 'get_prompt_response(prompt_name)' inside a block without that prompt supplied",
//   async (t) => {
//     let dir = "";
//     await t.step("setup", async () => {
//       dir = await Deno.makeTempDir();
//       Deno.chdir(dir);
//     });

//     await t.step("test", async () => {
//       assert(false);
//     });

//     await t.step("cleanup", async () => {
//       Deno.chdir("..");
//       await Deno.remove(dir, { recursive: true });
//     });
//   },
// );

// Deno.test(
//   "templates should fail to parse if a block condition is anything other than a 3 item array",
//   async (t) => {
//     let dir = "";
//     await t.step("setup", async () => {
//       dir = await Deno.makeTempDir();
//       Deno.chdir(dir);
//     });

//     await t.step("test", async () => {
//       assert(false);
//     });

//     await t.step("cleanup", async () => {
//       Deno.chdir("..");
//       await Deno.remove(dir, { recursive: true });
//     });
//   },
// );

// Deno.test(
//   "templates should fail to parse if a prompt has a validator or validator key which is undefined",
//   async (t) => {
//     let dir = "";
//     await t.step("setup", async () => {
//       dir = await Deno.makeTempDir();
//       Deno.chdir(dir);
//     });

//     await t.step("test", async () => {
//       assert(false);
//     });

//     await t.step("cleanup", async () => {
//       Deno.chdir("..");
//       await Deno.remove(dir, { recursive: true });
//     });
//   },
// );

// Deno.test(
//   "templates should fail to parse if a prompt or block has a condition where the second item is not a comparator?",
//   async (t) => {
//     let dir = "";
//     await t.step("setup", async () => {
//       dir = await Deno.makeTempDir();
//       Deno.chdir(dir);
//     });

//     await t.step("test", async () => {
//       assert(false);
//     });

//     await t.step("cleanup", async () => {
//       Deno.chdir("..");
//       await Deno.remove(dir, { recursive: true });
//     });
//   },
// );
