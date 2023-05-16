import { getPrettyJSONString } from "src/utils.ts";

type LocalsArgs = {
  cndi_project_name: string;
  node_name_list: string[];
};

export default function getVariablesTFJSON(
  { cndi_project_name, node_name_list }: LocalsArgs,
): string {
  return getPrettyJSONString({
    locals: {
      cndi_project_name,
      node_name_list,
    },
  });
}
