import { getPrettyJSONString } from "src/utils.ts";

type TFVariable = {
  description: string;
  type: string;
};

export default function getVariablesTFJSON(): string {
  const variable: Record<string, TFVariable> = {
    // aks module requires cred be set explicitly
    client_id: {
      description:
        "The Client ID (appId) for the Service Principal used for the AKS deployment",
      type: "string",
    },
    client_secret: {
      description:
        "The Client Secret (password) for the Service Principal used for the AKS deployment",
      type: "string",
    },
  };

  return getPrettyJSONString({
    variable,
  });
}
