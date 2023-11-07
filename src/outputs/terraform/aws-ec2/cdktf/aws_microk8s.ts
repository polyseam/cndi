import { App, Construct, TerraformStack } from "deps";
import { instance } from "./deps.ts";
import { getUserDataTemplateFileString } from "src/utils.ts";
import { CNDIConfig } from "src/types.ts";

class AWSMicrok8sStack extends TerraformStack {
  constructor(scope: Construct, name: string, config: CNDIConfig) {
    super(scope, name);
    let nodeIndex = 0;

    for (const node of config.nodes) {
      const role = nodeIndex === 0 ? "leader" : "controller";
      const user_data = getUserDataTemplateFileString(role);

      new instance.AwsInstance(this, `cndi_aws_instance_${node.name}`, {
        userData: user_data,
        tags: { Name: node.name, CNDIProject: config.project_name },
      });

      nodeIndex++;
    }

    new instance.AwsInstance(this, "instance", { tags: { Name: "" } });
  }
}

export default function main(cndi_config: CNDIConfig) {
  const app = new App();
  new AWSMicrok8sStack(app, `${cndi_config.project_name}`, cndi_config);
  app.synth();
}
