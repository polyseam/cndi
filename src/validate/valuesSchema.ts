import { Ajv, ccolors, DefinedError } from "deps";
import { emitExitEvent, getPrettyJSONString } from "src/utils.ts";

const _validateValsLabel = ccolors.faded("src/validate/valuesSchema.ts:");

export default async function validateValuesForSchema(
  releaseName: string,
  valuesSchemaURL: string,
  values: Record<string, unknown>,
): Promise<boolean> {
  try {
    new URL(valuesSchemaURL);
  } catch (_e) {
    console.log(
      ccolors.error(
        `Invalid 'valuesSchema' URL in applications.${releaseName}:`,
      ),
      ccolors.user_input(valuesSchemaURL),
    );
    await emitExitEvent(1300);
    Deno.exit(1300);
  }

  // @ts-ignore TODO: expression not constructable??
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateFormats: false,
  });

  let schemaJSON: Record<string, unknown>;

  try {
    const valSchemaResponse = await fetch(valuesSchemaURL);
    schemaJSON = await valSchemaResponse.json();
  } catch (fetchErr) {
    console.log(
      ccolors.error(
        `Failed to fetch 'valuesSchema' in applications.${releaseName}:`,
      ),
      ccolors.user_input(valuesSchemaURL),
    );
    ccolors.caught(fetchErr);
    await emitExitEvent(1301);
    Deno.exit(1301);
  }

  try {
    const validate = ajv.compile(schemaJSON);

    const result = validate(values);

    if (!result) {
      validate.errors.forEach((err: DefinedError) => {
        console.log();

        const valPath = ccolors.key_name(
          `applications.${releaseName}.values${
            err?.instancePath.replaceAll("/", ".")
          }`,
        );

        const keyword = err?.keyword;

        switch (keyword) {
          case "type":
            console.log(
              valPath,
              ccolors.warn(
                `must be of type: ${ccolors.user_input(err.params.type!)}`,
              ),
            );
            break;

          case "enum":
            console.log(valPath, ccolors.warn(`${err.message}:`), `\n`);
            err?.params?.allowedValues?.map((allowed: string) => {
              console.log(ccolors.warn("-"), ccolors.user_input(allowed));
            });
            break;

          case "additionalProperties":
            console.log(
              valPath,
              ccolors.warn(
                `contains invalid property: ${
                  ccolors.user_input(
                    err.params.additionalProperty,
                  )
                }`,
              ),
            );
            break;

          case "required":
            console.log(
              valPath,
              ccolors.warn(
                `is missing required property: ${
                  ccolors.user_input(
                    err.params.missingProperty,
                  )
                }`,
              ),
            );
            break;

          case "oneOf":
            console.log(
              valPath,
              ccolors.warn(
                `does not match exactly one of the provided schemas`,
              ),
            );
            break;

          case "anyOf":
            console.log(
              valPath,
              ccolors.warn(`does not match any of the provided schemas`),
            );
            break;

          default:
            console.log(
              `${valPath} ${ccolors.warn(err.message || "")} ${keyword}\n\n${
                getPrettyJSONString(err)
              }`,
            );
            break;
        }
      });
      return false;
    }
    return true;
  } catch (errValidating) {
    console.log(
      ccolors.error(
        `Unable to perform validation of applications.${releaseName}:`,
      ),
    );
    console.log(ccolors.caught(errValidating));
    await emitExitEvent(1302);
    Deno.exit(1302);
  }
}
