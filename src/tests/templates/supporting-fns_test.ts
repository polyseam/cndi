import { assert } from "test-deps";
import { literalizeTemplateValuesInString } from "src/templates/useTemplate.ts";
import { replaceRange } from "src/utils.ts";

Deno.test("literalizeTemplateValuesInString", () => {
  const promptResponses = {
    exampleA: "foo",
    exampleB: "bar",
    numberExample: 1300,
    booleanExample: true,
    stringArrayExample: ["foo", "bar", "baz"],
    whiteSpaceIgnored: true,
    boolArrayExample: [true, false, true],
    mixedArrayExample: [true, "foo", 1300],
  };

  const cndiConfigStr = `{
        "cluster_manifests": {
          "myExampleA": "{{ $.cndi.prompts.responses.exampleA }}",
          "myExampleB": "{{ $.cndi.prompts.responses.exampleB }}",
          "numberExample": "{{ $.cndi.prompts.responses.numberExample }}",
          "booleanExample": "{{ $.cndi.prompts.responses.booleanExample }}",
          "stringArrayExample": "{{ $.cndi.prompts.responses.stringArrayExample }}",
          "whitespaceIgnored": "{{      $.cndi.prompts.responses.whiteSpaceIgnored              }}",
          "boolArrayExample": "{{ $.cndi.prompts.responses.boolArrayExample }}",
          "mixedArrayExample": "{{ $.cndi.prompts.responses.mixedArrayExample }}",
          "title": "my-{{ $.cndi.prompts.responses.exampleA }}-{{ $.cndi.prompts.responses.exampleB }}-cluster"
        }
      }`;

  const literalized = literalizeTemplateValuesInString(
    promptResponses,
    cndiConfigStr,
  );

  assert(literalized.indexOf(`"myExampleA": "foo"`) > -1);
  assert(literalized.indexOf(`"myExampleB": "bar"`) > -1);
  assert(literalized.indexOf(`"title": "my-foo-bar-cluster"`) > -1);
  assert(literalized.indexOf(`"numberExample": 1300`) > -1);
  assert(literalized.indexOf(`"stringArrayExample": ["foo","bar","baz"]`) > -1);
  assert(literalized.indexOf(`"boolArrayExample": [true,false,true]`) > -1);
  assert(literalized.indexOf(`"mixedArrayExample": [true,"foo",1300]`) > -1);
  assert(literalized.indexOf(`"booleanExample": true`) > -1);
  assert(literalized.indexOf(`"whitespaceIgnored": true`) > -1);
});

Deno.test("replaceRange", () => {
  const str = "foo bar baz";
  const replaced = replaceRange(str, 4, 7, "qux");
  assert(replaced === "foo qux baz");

  const str2 = "foo bar baz";
  const replaced2 = replaceRange(str2, 0, 3, `230`);
  assert(replaced2 === "230 bar baz");
});
