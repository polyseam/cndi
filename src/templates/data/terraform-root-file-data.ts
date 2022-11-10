import { TerraformRootFileData } from "../../types.ts";

const terraformRootFileData: TerraformRootFileData = {
  locals: [
    {
      bootstrap_token: "${random_password.generated_token.result}",
      controller_node_ip: "",
      git_password: "${var.git_password}",
      git_username: "${var.git_username}",
      git_repo: "${var.git_repo}",
      argoui_readonly_password: "${var.argoui_readonly_password}",
      sealed_secrets_private_key: "${var.sealed_secrets_private_key}",
      sealed_secrets_public_key: "${var.sealed_secrets_public_key}",
      gateway_id: "${aws_internet_gateway.igw.id}",
      load_balancer_arn: "${aws_lb.nlb.arn}",
      route_table_id: "${aws_route_table.rt.id}",
      subnet_id: "${aws_subnet.subnet.id}",
      target_group_http_arn: "${aws_lb_target_group.tg-http.arn}",
      target_group_https_arn: "${aws_lb_target_group.tg-https.arn}",
      target_id: "",
      vpc_id: "${aws_vpc.vpc.id}",
      vpc_security_group_id: "${aws_security_group.sg.id}",
      route_table: "${aws_route_table.rt}",
    },
  ],
  provider: {
    random: [{}],
    aws: [{}],
  },
  resource: [{
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
  terraform: [
    {
      required_providers: [
        {
          external: {
            source: "hashicorp/external",
            version: "2.2.2",
          },
        },
      ],
      required_version: ">= 1.2.0",
    },
  ],
  variable: {
    git_password: [
      {
        description: "password for accessing the repositories",
        type: "string",
      },
    ],
    git_username: [
      {
        description: "password for accessing the repositories",
        type: "string",
      },
    ],
    git_repo: [
      {
        description: "repository URL to access",
        type: "string",
      },
    ],
    argoui_readonly_password: [
      {
        description: "password for accessing the argo ui",
        type: "string",
      },
    ],
    sealed_secrets_private_key: [
      {
        description: "private key for decrypting sealed secrets",
        type: "string",
      },
    ],
    sealed_secrets_public_key: [
      {
        description: "public key for encrypting sealed secrets",
        type: "string",
      },
    ],
  },
};

export default terraformRootFileData;
