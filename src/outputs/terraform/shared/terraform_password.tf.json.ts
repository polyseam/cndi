import { getPrettyJSONString } from "src/utils.ts";

const terraformPassword = {
  resource: {
    random_password: {
      generated_token: [
        {
          length: 32,
          special: false,
          upper: false,
        },
      ],
    },
  },
};

export default function getTerraformPasswordTFJSON(): string {
  return getPrettyJSONString(terraformPassword);
}
