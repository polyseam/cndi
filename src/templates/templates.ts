import {
  ccolors,
  getValueFromKeyPath,
  prompt,
  PromptTypes,
  setValueForKeyPath,
  unsetValueForKeyPath,
  YAML,
} from "deps";

import CNDITemplateComparators from "./comparators.ts";
import { BuiltInValidators } from "./validators.ts";
import {
  getObjectKeysRecursively,
  homedir,
  isValidUrl,
  replaceRange,
  unwrapQuotes,
} from "./util.ts";

export const POLYSEAM_TEMPLATE_DIRECTORY =
  "file:///Users/m/dev/polyseam/cndi/templates/";

interface SealedSecretsKeys {
  sealed_secrets_private_key: string;
  sealed_secrets_public_key: string;
}

interface CNDIGeneratedValues {
  sealedSecretsKeys: SealedSecretsKeys;
  terraformStatePassphrase: string;
  argoUIAdminPassword: string;
}

export type PromptType = keyof typeof PromptTypes;

type CNDITemplateConditionTuple = [
  CNDITemplatePromptResponsePrimitive, // input, eg. $cndi.get_prompt_response(foo
  keyof typeof CNDITemplateComparators, // comparator, eg. "=="
  CNDITemplatePromptResponsePrimitive, // standard, eg. "bar"
];

type CNDITemplatePromptEntry = {
  type: PromptType;
  name: string;
  message: string;
  default?: string | number | boolean | Array<unknown>;
  options?: Array<unknown>;
  validators?: Array<string | Record<string, unknown>>;
  condition: CNDITemplateConditionTuple;
};

type BuiltInValidator = keyof typeof BuiltInValidators;

export type CNDITemplatePromptResponsePrimitive =
  | string
  | number
  | boolean
  | Array<string>
  | Array<number>
  | Array<boolean>;

type ComparatorFunction = (
  input: CNDITemplatePromptResponsePrimitive,
  standard: CNDITemplatePromptResponsePrimitive,
) => boolean;

type CNDITokenOperation =
  | "get_prompt_response"
  | "get_block"
  | "get_string"
  | "get_arg"
  | "comment";

type CNDIToken = {
  operation: CNDITokenOperation;
  params: string[];
};

type Block = {
  name: string;
  content?: Record<string, unknown>;
  content_path?: string;
  content_url?: string;
};

// better to have a defined list of builtin templates than walk /templates directory
export function getKnownTemplates() {
  const knownTemplates = [
    {
      name: "basic",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/basic.yaml`,
    },
    {
      name: "airflow",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/airflow.yaml`,
    },
    {
      name: "cnpg",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/cnpg.yaml`,
    },
    {
      name: "neo4j",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/neo4j.yaml`,
    },
    {
      name: "proxy",
      url: `${POLYSEAM_TEMPLATE_DIRECTORY}/proxy.yaml`,
    },
  ];
  return knownTemplates;
}

interface TemplateResult {
  cndi_config: string;
  env: string;
  readme: string;
  responses: Record<string, CNDITemplatePromptResponsePrimitive>;
}

interface TemplateObject {
  blocks: Array<Block>;
  prompts: Array<CNDITemplatePromptEntry>;
  outputs: {
    cndi_config: Record<string, unknown>;
    env: Record<string, unknown>;
    readme: Record<string, unknown>;
  };
}

function coarselyValidateTemplateObjectOrPanic(templateObject: TemplateObject) {
  if (!Object.hasOwn(templateObject, "outputs")) {
    console.error("template is missing outputs, resulting in a noop");
    Deno.exit(1);
  }
  if (!Object.hasOwn(templateObject, "prompts")) {
    console.error(
      "template is missing prompts, if this is intentionaln please provide an empty array",
    );
    Deno.exit(1);
  }
}

function resolveCNDIPromptCondition(
  condition: CNDITemplateConditionTuple,
  responses: Record<string, CNDITemplatePromptResponsePrimitive>,
): boolean {
  const [input, comparator, standard] = condition;
  const standardType = typeof standard;

  console.log(
    ccolors.user_input(`condition: ${input} ${comparator} ${standard}`),
  );

  let val = input;

  if (typeof input === "string") {
    val = literalizeTemplateWithResponseValues(input, responses);

    if (val === undefined) {
      console.log(`value for '${input}' is undefined`);
      return false;
    }

    if (standardType === "number") {
      val = parseInt(input);
    } else if (standardType === "boolean") {
      val = val === "true" ? true : false;
    }

    const verdict = CNDITemplateComparators[comparator](val, standard);

    return verdict || false;
  } else {
    const verdict = CNDITemplateComparators[comparator](
      val,
      standard as CNDITemplatePromptResponsePrimitive,
    );
    return verdict || false;
  }
}

type CliffyPrompt = {
  type: (typeof PromptTypes)[keyof typeof PromptTypes];
  name: string;
  message: string;
  default?: string | number | boolean | Array<unknown>;
  options?: Array<unknown>;
  validators?: Array<string | Record<string, unknown>>;
  condition: CNDITemplateConditionTuple;
  after: (
    result: Record<string, CNDITemplatePromptResponsePrimitive>,
    next: (nextPromptName?: string | true) => Promise<void>,
  ) => Promise<void>;
  before: (
    localResponses: Record<string, CNDITemplatePromptResponsePrimitive>,
    next: (nextPromptName?: string | true) => Promise<void>,
  ) => Promise<void>;
};

function getCliffyPrompts(
  promptDefinitions: Array<CNDITemplatePromptEntry>,
  externalResponses: Record<string, CNDITemplatePromptResponsePrimitive>,
): Array<CliffyPrompt> {
  return promptDefinitions.map((promptDefinition) => {
    const type = PromptTypes[promptDefinition.type];
    return {
      ...promptDefinition,
      type,
      after: async (
        result: Record<string, CNDITemplatePromptResponsePrimitive>,
        next: (nextPromptName?: string | true) => Promise<void>,
      ) => {
        const currentResponse = result[promptDefinition.name];
        // File is the only prompt type that is not Cliffy native
        if (promptDefinition.type === "File") {
          if (currentResponse && typeof currentResponse === "string") {
            const pathToFile = currentResponse.replace("~", homedir() || "~");
            let fileContents = "";
            try {
              fileContents = Deno.readTextFileSync(pathToFile);
            } catch (fileReadError) {
              console.log(ccolors.warn(`${fileReadError?.message}`));
              await next(promptDefinition.name); // run prompt again
            }
            result[promptDefinition.name] = fileContents;
            if (fileContents.length > 0) {
              // await next(); everything is fine
            } else {
              console.log("file is empty!");
              await next(promptDefinition.name); // run prompt again
            }
          } else {
            await next(promptDefinition.name); // run prompt again
          }
        }

        //if the prompt has a validator, run it
        if (
          promptDefinition.validators &&
          Array.isArray(promptDefinition.validators)
        ) {
          const validity: Array<boolean> = [];
          for (const validatorSpec of promptDefinition.validators) {
            let validatorName;
            let arg;
            if (typeof validatorSpec !== "string") {
              validatorName = Object.keys(validatorSpec)[0];
              arg = validatorSpec[validatorName];
            } else {
              validatorName = validatorSpec;
            }

            const validate =
              BuiltInValidators[validatorName as BuiltInValidator];

            if (typeof validate != "function") {
              throw new Error(`validator '${validatorName}' not found`);
            } else {
              const validationError = validate({
                value: currentResponse,
                type: promptDefinition.type,
                arg,
              });
              if (validationError) {
                console.log(ccolors.error(validationError));
                await next(promptDefinition.name); // run like prompt again
              } else {
                validity.push(true);
                if (validity.length === promptDefinition.validators.length) {
                  // all validations for prompt passed, proceed to next prompt
                  await next();
                  return;
                }
                continue;
              }
            }
          }
        } else {
          await next();
        }
      },
      before: async (
        localResponses: Record<string, CNDITemplatePromptResponsePrimitive>,
        next: (nextPromptName?: string | true) => Promise<void>,
      ) => {
        const responses = { ...externalResponses, ...localResponses };

        // if there is no condition, show the prompt
        if (!promptDefinition?.condition) {
          return await next();
        }

        const shouldShowPrompt = resolveCNDIPromptCondition(
          promptDefinition.condition,
          responses,
        );

        // if the condition is met, show the prompt
        if (shouldShowPrompt) {
          return await next();
        }
        // the condition was not met, so skip the prompt
        return await next(true);
      },
    };
  });
}

export function parseAsCNDIToken(token: string): CNDIToken | null {
  // given a string like $cndi.get_prompt_response(foo)
  // return {operation: 'get_prompt_response', param: 'foo'}
  if (!token) return null;
  const keyword = "$cndi.";
  const leftParen = token.indexOf("(");
  if (!token.startsWith(keyword)) return null;
  const operation = token.substring(
    keyword.length,
    leftParen,
  ) as CNDITokenOperation;
  if (!operation) return null;
  const rightParen = token.lastIndexOf(")");
  const untrimmedParams = token.substring(leftParen + 1, rightParen).split(",");
  const params = [];

  for (const param of untrimmedParams) {
    if (param) {
      params.push(param.trim());
    }
  }
  return { operation, params };
}

export function literalizeTemplateWithResponseValues(
  template: string,
  values: Record<string, CNDITemplatePromptResponsePrimitive>,
  funcName = "$cndi.get_prompt_response",
): string {
  const fnName = funcName + "(";
  let literalizedString = template;

  let indexOfOpeningBraces = literalizedString.indexOf("{{");
  let indexOfClosingBraces = literalizedString.indexOf("}}");

  // loop so long as there is '{{ something }}' in the string
  while (
    indexOfOpeningBraces !== -1 &&
    indexOfClosingBraces !== -1 &&
    literalizedString.indexOf(fnName) < indexOfClosingBraces &&
    literalizedString.indexOf(fnName) > indexOfOpeningBraces
  ) {
    const contentsOfFirstPair = literalizedString.substring(
      indexOfOpeningBraces + 2,
      indexOfClosingBraces,
    );

    const trimmedContents = contentsOfFirstPair.trim();
    const [_, keyWithParen] = trimmedContents.split(fnName);
    const key = keyWithParen.substring(0, keyWithParen.length - 1);
    const valueToSubstitute = values[key];

    if (key) {
      const typeofValueToSubstitute = typeof valueToSubstitute;
      if (typeofValueToSubstitute === "string") {
        const indexOfClosingBracesInclusive = indexOfClosingBraces + 2;
        literalizedString = replaceRange(
          literalizedString,
          indexOfOpeningBraces,
          indexOfClosingBracesInclusive,
          valueToSubstitute,
        );
      } else if (valueToSubstitute === undefined) {
        // if there is no prompt response flag it
        // if any flags exist in the final output we will throw up the flag
        const indexOfClosingBracesInclusive = indexOfClosingBraces + 2;
        const fn = fnName.split("$cndi.")[1].split("(")[0];
        literalizedString = replaceRange(
          literalizedString,
          indexOfOpeningBraces,
          indexOfClosingBracesInclusive,
          `${fn}::${key};`,
        );
      } else {
        const indexOfOpenWrappingQuote = indexOfOpeningBraces - 1;
        const indexOfClosingWrappingQuoteInclusive = indexOfClosingBraces + 3;

        // this block is important because it tells template authors
        // when they depend on a variable that is not in scope
        // if (valueToSubstitute === undefined) {
        //   const fn = fnName.split("$cndi.")[1].split("(")[0];
        //   console.log(
        //     ccolors.error(
        //       `could not find a ${ccolors.key_name(
        //         fn
        //       )} value for "${ccolors.user_input(key)}"`
        //     )
        //   );
        //   Deno.exit(1);
        // }

        literalizedString = replaceRange(
          literalizedString,
          indexOfOpenWrappingQuote,
          indexOfClosingWrappingQuoteInclusive,
          valueToSubstitute,
        );
      }
    }
    indexOfOpeningBraces = literalizedString.indexOf("{{");
    indexOfClosingBraces = literalizedString.indexOf("}}");
  }
  return literalizedString;
}

// only handles blocks loaded in from keys
async function literalizeTemplateWithBlocks(
  template: string,
  blocks: Array<Block>,
  responses: Record<string, CNDITemplatePromptResponsePrimitive>,
): Promise<string> {
  const lit_template = literalizeTemplateWithResponseValues(
    template,
    responses,
  );

  const parsedLitTemplate = YAML.parse(lit_template) as Record<string, unknown>;

  const keys = getObjectKeysRecursively(parsedLitTemplate);

  const tokens: CNDIToken[] = [];

  const uniqueSlotStrings = new Set<string>();
  const destinationSlots: Array<Array<string>> = [];

  keys.forEach((key: string) => {
    if (key.includes("$cndi.")) {
      let [left, right] = key.split("$cndi.");

      // hinges on the idea that a key can only have a body including args and/or condition
      if (right.includes(".args.")) {
        right = right.split(".args.")[0];
      }

      if (right.includes(".condition.")) {
        right = right.split(".condition.")[0];
      }

      // madness resulting from `$cndi.` being a fragement of a key segment rather than a key segment
      if (right.includes("(") && right.indexOf(")") == right.length - 1) {
        if (left.charAt(left.length - 1) === ".") {
          left = left.substring(0, left.length - 1);
        }
        const slot = [...left.split("."), `$cndi.${right}`];
        const slotString = slot.join(".");
        if (!uniqueSlotStrings.has(slotString)) {
          destinationSlots.push(slot);
          uniqueSlotStrings.add(slotString);
          const toke = parseAsCNDIToken(`$cndi.${right}`);
          if (toke) {
            tokens.push(toke);
          }
        }
      }
    }
  });

  let i = 0;
  for (const slot of destinationSlots) {
    const debugSlotStr = slot.join(ccolors.success("."));
    console.log(
      ccolors.key_name("\n--- processing slot"),
      debugSlotStr,
      ccolors.key_name("---"),
    );

    const toke = tokens[i];

    switch (toke?.operation) {
      case "comment": {
        // logic needs to process template output as a string rather than an object
        break;
      }
      case "get_block": {
        const containing_slot_path = slot.slice(0, -1);

        const contained_in_slot = getValueFromKeyPath(
          parsedLitTemplate,
          containing_slot_path,
        );

        const body = getValueFromKeyPath(parsedLitTemplate, slot);

        // if body is undefined, this means that a slot that was previously present in parsedLitTemplate
        // has been superseded by a peer in the same containing slot
        if (body === undefined) {
          break;
        }

        const blockIdentifier = toke.params[0];
        let shouldDisplay = true;

        const block = await get_block(
          literalizeTemplateWithResponseValues(blockIdentifier, responses),
          blocks,
        );

        let blockString;

        if (typeof block === "string") {
          blockString = block;
        } else {
          blockString = YAML.stringify(block);
        }

        if (body) {
          if (body.condition) {
            console.log("--- evaluating condition", debugSlotStr, "---");
            console.log(body.condition);
            shouldDisplay = resolveCNDIPromptCondition(
              body.condition,
              responses,
            );
          }

          if (body.args) {
            for (const argName in body.args) {
              const argValue = body.args[argName];
              if (typeof argValue === "string") {
                body.args[argName] = literalizeTemplateWithResponseValues(
                  argValue,
                  responses,
                );
              } else {
                body.args[argName] = argValue;
              }
            }
            blockString = literalizeTemplateWithResponseValues(
              YAML.stringify(block),
              body.args || {},
              "$cndi.get_arg",
            );
          }
        }

        if (shouldDisplay) {
          blockString = literalizeTemplateWithResponseValues(
            blockString,
            responses,
          );
          console.log(
            ccolors.key_name("\n--- setting slot"),
            debugSlotStr,
            ccolors.key_name("---"),
          );
          // put the block in the slot
          setValueForKeyPath(
            parsedLitTemplate,
            containing_slot_path,
            YAML.parse(blockString),
          );
        } else {
          console.log(
            ccolors.error("\n--- unsetting slot"),
            debugSlotStr,
            ccolors.error("---"),
          );
          // the block should not be displayed, set its value to null
          setValueForKeyPath(parsedLitTemplate, slot, null);

          // if every block in the slot is null, remove the slot
          const containedKeys = Object.keys(contained_in_slot);
          if (containedKeys.every((key) => !contained_in_slot[key])) {
            unsetValueForKeyPath(parsedLitTemplate, containing_slot_path);
          }
        }
        console.log("parsedLitTemplate for", debugSlotStr);
        console.log(parsedLitTemplate);
        break;
      }
    }
    i++;
  }

  const finalStr = YAML.stringify(parsedLitTemplate);
  return finalStr;
}

// takes a body of text containing '$cndi.comment(my_comment): Hi!' calls
// and replaces them with '# Hi!' or '\n<!-- Hi! -->' depending on the mode
const commentifyLn = (mode = "yaml") => (ln: string) => {
  const callPos = ln.indexOf("$cndi.comment(");
  if (callPos > -1) {
    let beginSymbol = "#";
    let endSymbol = "";

    if (mode === "md") {
      beginSymbol = "\n<!--";
      endSymbol = " -->\n";
    }

    const startPos = ln.indexOf("): ");
    const whitespace = " ".repeat(callPos);
    const commentContent = ln.substring(startPos + 3);
    const comment = `${whitespace}${beginSymbol} ${
      unwrapQuotes(
        commentContent,
      )
    }${endSymbol}`;

    return comment;
  }
  return ln;
};

async function parseCNDIConfigSection(
  cndi_spec: string,
  responses: Record<string, CNDITemplatePromptResponsePrimitive>,
  blocks: Array<Block>,
): Promise<string> {
  const lit_template = literalizeTemplateWithResponseValues(
    cndi_spec,
    responses,
  );

  const lit_template_with_blocks = await literalizeTemplateWithBlocks(
    lit_template,
    blocks,
    responses,
  );

  const undefinedPromptToken = "get_prompt_response::";

  const indexOfUndefinedPrompt = lit_template_with_blocks.indexOf(
    undefinedPromptToken,
  );

  if (indexOfUndefinedPrompt > -1) {
    const undefinedPromptName = lit_template_with_blocks.substring(
      indexOfUndefinedPrompt + undefinedPromptToken.length,
      lit_template_with_blocks.indexOf(";", indexOfUndefinedPrompt),
    );
    console.log(ccolors.error("template error:"));
    console.log(
      ccolors.error("prompt_response"),
      ccolors.user_input(undefinedPromptName),
      ccolors.error("is undefined"),
    );
    Deno.exit(1);
  }

  const undefinedArgToken = "get_arg::";

  const indexOfUndefinedArgToken = lit_template_with_blocks.indexOf(
    undefinedArgToken,
  );

  if (indexOfUndefinedArgToken > -1) {
    const undefinedArgName = lit_template_with_blocks.substring(
      indexOfUndefinedArgToken + undefinedArgToken.length,
      lit_template_with_blocks.indexOf(";", indexOfUndefinedPrompt),
    );
    console.log(ccolors.error("template error:"));
    console.log(
      ccolors.error("arg"),
      ccolors.user_input(undefinedArgName),
      ccolors.error("is undefined"),
    );
    Deno.exit(1);
  }

  const cndi_configObj = YAML.parse(lit_template_with_blocks);

  const lines = YAML.stringify(cndi_configObj).split("\n");
  const cndi_config = lines.map(commentifyLn()).join("\n");
  return cndi_config;
}

type BlockSpecValue = {
  condition?: CNDITemplateConditionTuple;
  args?: Record<string, CNDITemplatePromptResponsePrimitive>;
};

async function parseEnvSection(
  env_spec: string,
  responses: Record<string, CNDITemplatePromptResponsePrimitive>,
  blocks: Array<Block>,
): Promise<string> {
  const env: Array<string> = [];
  const envObj = YAML.parse(env_spec) as Record<string, unknown>;

  for (const key in envObj) {
    const value = envObj[key];
    const key_token = parseAsCNDIToken(key);

    if (!key_token) {
      const v = literalizeTemplateWithResponseValues(`${value}`, responses);
      env.push(`${key}=${v}`);
      continue;
    }

    if (key_token.operation === "comment") {
      env.push(`\n# ${value}`);
      continue;
    }

    if (key_token.operation === "get_block") {
      const body = value as BlockSpecValue;
      const blockIdentifier = literalizeTemplateWithResponseValues(
        key_token.params[0],
        responses,
      );

      let blockWithoutResponses = await get_block(blockIdentifier, blocks);

      if (typeof blockWithoutResponses != "string") {
        blockWithoutResponses = YAML.stringify(blockWithoutResponses);
      }

      let blockWithArgs;

      let shouldWrite = true;

      if (body) {
        if (body.condition) {
          shouldWrite = resolveCNDIPromptCondition(body.condition, responses);
        }
      }

      if (shouldWrite) {
        const blockWithoutArgs = YAML.parse(
          literalizeTemplateWithResponseValues(
            blockWithoutResponses,
            responses,
          ),
        ) as Record<string, unknown>;

        if (body && body.args) {
          for (const argName in body.args) {
            const argValue = body.args[argName];
            if (typeof argValue === "string") {
              body.args[argName] = literalizeTemplateWithResponseValues(
                argValue,
                responses,
              );
            } else {
              body.args[argName] = argValue;
            }
          }
          blockWithArgs = YAML.parse(
            literalizeTemplateWithResponseValues(
              YAML.stringify(blockWithoutArgs),
              body.args,
              "$cndi.get_arg",
            ),
          ) as Record<string, unknown>;
        } else {
          blockWithArgs = blockWithoutArgs;
        }

        for (const k in blockWithArgs) {
          const v = blockWithArgs[k];
          const toke = parseAsCNDIToken(k);
          if (toke?.operation === "comment") {
            env.push(`\n# ${v}`);
          } else if (v) {
            env.push(`${k}=${v}`);
          } else {
            env.push(`${k}=__${k}_PLACEHOLDER__`);
          }
        }
      }
    }
  }
  return env.join("\n");
}

async function parseReadmeSection(
  readme_spec: string,
  responses: Record<string, CNDITemplatePromptResponsePrimitive>,
): Promise<string> {
  const readmeMap = YAML.parse(readme_spec) as Record<string, string>;

  const readmeSections = [];
  if (responses.project_name) {
    readmeSections.push(`# ${responses.project_name}\n\n`);
  }
  for (const key in readmeMap) {
    const toke = parseAsCNDIToken(key);
    if (toke) {
      if (toke?.operation === "get_string") {
        const blockIdentifier = literalizeTemplateWithResponseValues(
          toke.params[0],
          responses,
        );
        const readmeStr = await get_string(blockIdentifier);
        readmeSections.push(readmeStr);
        continue;
      }

      if (toke?.operation === "get_block") {
        console.error("$cndi.get_block() not supported in readme section");
        console.log("please use $cndi.get_string() instead");
        readmeSections.push("\n\n");
        continue;
      }

      // comments handled downstream
      if (toke?.operation === "comment") {
        readmeSections.push(`<!-- ${readmeMap[key]} -->`);
        continue;
      }
    } else {
      readmeSections.push(readmeMap[key]);
    }
  }
  return readmeSections.join("\n");
}

async function get_string(identifier: string) {
  if (isValidUrl(identifier)) {
    let blockResponse: Response;

    try {
      // fetch
      blockResponse = await fetch(identifier);
    } catch (fetchError) {
      console.log("error fetching string", ccolors.user_input(identifier));
      throw fetchError;
    }

    try {
      // get text
      return await blockResponse.text();
    } catch (responseTextError) {
      console.log(
        "error getting text from block response",
        ccolors.user_input(identifier),
      );
      throw responseTextError;
    }
  }
}

async function get_block(
  identifier: string,
  blocks: Array<Block>,
): Promise<Record<string, unknown> | string> {
  if (isValidUrl(identifier)) {
    let blockResponse: Response;
    let blockText: string;

    try {
      // fetch
      blockResponse = await fetch(identifier);
    } catch (fetchError) {
      console.log("error fetching block", ccolors.user_input(identifier));
      throw fetchError;
    }

    try {
      // get text
      blockText = await blockResponse.text();
    } catch (responseTextError) {
      console.log(
        "error getting text from block response",
        ccolors.user_input(identifier),
      );
      throw responseTextError;
    }

    try {
      // parse yaml
      const blockContent = YAML.parse(blockText);
      return blockContent as Record<string, unknown>;
    } catch (yamlParseError) {
      if (identifier.endsWith("yaml") || identifier.endsWith("yml")) {
        console.log(
          "error parsing yaml from block response",
          ccolors.user_input(identifier),
        );
        throw yamlParseError;
      } else {
        return blockText as string;
      }
    }
  } else {
    const block = blocks.find((block) => block.name === identifier);
    if (block?.content) {
      return block.content;
    }
    if (block?.content_path) {
      return YAML.parse(Deno.readTextFileSync(block.content_path)) as Record<
        string,
        unknown
      >;
    }
    if (block?.content_url) {
      const blockResponse = await fetch(block.content_url);
      const blockText = await blockResponse.text();
      return YAML.parse(blockText) as Record<string, unknown>;
    }
    throw new Error(`block "${identifier}" could not be resolved`);
  }
}

function getDefaultResponsesFromCliffyPrompts(
  cliffyPrompts: Array<CliffyPrompt>,
): Record<string, CNDITemplatePromptResponsePrimitive> {
  const responses: Record<string, CNDITemplatePromptResponsePrimitive> = {};
  for (const prompt of cliffyPrompts) {
    responses[prompt.name] = prompt
      .default as CNDITemplatePromptResponsePrimitive;
  }
  return responses;
}

export async function useTemplate(
  templateIdentifier: string,
  interactive: boolean,
  responseOverrides: Record<string, CNDITemplatePromptResponsePrimitive> = {},
): Promise<TemplateResult> {
  const isUrl = isValidUrl(templateIdentifier);
  let templateContents = "";

  if (isUrl) {
    const templateResponse = await fetch(templateIdentifier);
    templateContents = await templateResponse.text();
  } else if (templateIdentifier.indexOf("/") > -1) {
    // user is likely trying to load a file from the local filesystem
    templateContents = await Deno.readTextFile(templateIdentifier);
  } else {
    // user is likely trying to use a template from the built-in templates
    const knownTemplates = getKnownTemplates();
    const tpl = knownTemplates.find((t) => t.name === templateIdentifier);

    if (tpl) {
      const templateResponse = await fetch(tpl.url);
      templateContents = await templateResponse.text();
    } else {
      // user did nothing sensible
      throw new Error(`template '${templateIdentifier}' not found`);
    }
  }

  // parse the template file as YAML
  const unparsedTemplateObject = (await YAML.parse(
    templateContents,
  )) as TemplateObject;

  // prompts and outputs are required
  coarselyValidateTemplateObjectOrPanic(unparsedTemplateObject);

  // promptDefinitions are the prompts entries
  // after any remote prompts have been fetched and inserted

  // promptSpecifications are the raw prompts entries from a template file
  const promptSpecfications: Array<CNDITemplatePromptEntry> =
    unparsedTemplateObject?.prompts;

  const responses: Record<string, CNDITemplatePromptResponsePrimitive> = {};

  // if a user supplies prompt response overrides, do not display those prompts, just insert their values
  for (const responseName in responseOverrides) {
    const pSpecIndex = promptSpecfications.findIndex(
      (pSpec) => pSpec.name === responseName,
    );
    if (pSpecIndex > -1) {
      responses[responseName] = responseOverrides[responseName];
      promptSpecfications.splice(pSpecIndex, 1);
    }
  }

  const promptDefinitions: Array<CNDITemplatePromptEntry> = [];

  // if a prompt must be imported from a remote source, fetch it
  // then format it as a promptDefinition then add it to the promptDefinitions array
  console.log("\n\n---prompts-begin---");
  for (const promptSpec of promptSpecfications) {
    const promptKeys = Object.keys(promptSpec);
    const promptKeyRaw = promptKeys[0];

    // if the prompt only has a single key, it must be an import or be invalid
    const promptKeyToken = promptKeys.length == 1
      ? parseAsCNDIToken(promptKeyRaw)
      : null;

    const promptKeyIdentifier = promptKeyToken?.params[0];

    if (promptKeyIdentifier && promptKeyToken?.operation === "get_block") {
      const literalizedPromptKeyIdentifier =
        literalizeTemplateWithResponseValues(promptKeyIdentifier, responses);

      const promptSpecsFromBlock = await get_block(
        literalizedPromptKeyIdentifier,
        unparsedTemplateObject.blocks,
      );

      if (Array.isArray(promptSpecsFromBlock)) {
        // if a user supplies prompt response overrides, do not display those prompts, just insert their values
        // this time for prompts from blocks
        for (const responseName in responseOverrides) {
          const pSpecIndex = promptSpecsFromBlock.findIndex(
            (pSpec) => pSpec.name === responseName,
          );
          if (pSpecIndex > -1) {
            responses[responseName] = responseOverrides[responseName];
            promptSpecsFromBlock.splice(pSpecIndex, 1);
          }
        }

        const cliffyPromptsFromBlock = getCliffyPrompts(promptSpecsFromBlock, {
          ...responses,
        });

        const blockResponses = interactive
          // deno-lint-ignore no-explicit-any
          ? await prompt(cliffyPromptsFromBlock as any)
          : getDefaultResponsesFromCliffyPrompts(cliffyPromptsFromBlock);
        for (const key in blockResponses) {
          responses[key] = blockResponses[key];
        }
      } else {
        throw new Error("Block used for prompts must be an Array");
      }
    } else {
      promptDefinitions.push(promptSpec as CNDITemplatePromptEntry);
    }
  }

  const cliffyPrompts = getCliffyPrompts(promptDefinitions, responses);

  const tplResponses = interactive
    // deno-lint-ignore no-explicit-any
    ? await prompt(cliffyPrompts as any)
    : getDefaultResponsesFromCliffyPrompts(cliffyPrompts);

  for (const response in tplResponses) {
    responses[response] = tplResponses[response];
  }
  console.log("---prompts-end---\n\n");

  console.log("\n\n---cndi_config-begin---");

  const blocks = unparsedTemplateObject.blocks;

  // const parsed = YAML.parse(template_with_blocks) as ParsedTemplate;
  const cndi_config = await parseCNDIConfigSection(
    YAML.stringify(unparsedTemplateObject.outputs.cndi_config),
    responses,
    blocks,
  );
  console.log("---cndi_config-end---\n\n");

  console.log("\n\n---env-begin---");
  const env = await parseEnvSection(
    YAML.stringify(unparsedTemplateObject.outputs.env),
    responses,
    blocks,
  );
  console.log("---env-end---\n\n");

  console.log("\n\n---readme-begin---");
  const readme = await parseReadmeSection(
    YAML.stringify(unparsedTemplateObject.outputs.readme),
    responses,
  );
  console.log("---readme-end---\n\n");

  return {
    cndi_config,
    env,
    readme,
    responses,
  };
}
