import { getPrettyJSONString } from "src/utils.ts";

type LocalsArgs = {
  cndi_project_name: string;
};

export default function getVariablesTFJSON(
  { cndi_project_name }: LocalsArgs,
): string {
  return getPrettyJSONString({
    locals: {
      cndi_project_name,
    },
  });
}
