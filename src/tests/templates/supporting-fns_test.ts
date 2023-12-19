import { assert } from "test-deps";
import { replaceRange } from "src/utils.ts";

Deno.test("replaceRange", () => {
  const str = "foo bar baz";
  const replaced = replaceRange(str, 4, 7, "qux");
  assert(replaced === "foo qux baz");

  const str2 = "foo bar baz";
  const replaced2 = replaceRange(str2, 0, 3, `230`);
  assert(replaced2 === "230 bar baz");
});
