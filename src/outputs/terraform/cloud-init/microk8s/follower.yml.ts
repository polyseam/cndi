import { YAML } from "deps";
import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";
import { DEFAULT_K8S_VERSION } from "versions";
import { loopUntilSuccess } from "src/outputs/terraform/cloud-init/utils.ts";

type GetFollowerCloudInitOptions = {
  isWorker: boolean;
};

type Microk8sFollowerLaunchConfig = {
  version: string;
  join: {
    url: string;
    worker?: boolean;
  };
};

const getFollowerCloudInitYaml = (
  config: NormalizedCNDIConfig,
  options?: GetFollowerCloudInitOptions,
) => {
  const microk8sFollowerLaunchConfig: Microk8sFollowerLaunchConfig = {
    version: "0.1.0",
    join: {
      url: "\${leader_node_ip}:25000/\${join_token}",
    },
  };

  if (options?.isWorker) {
    microk8sFollowerLaunchConfig.join.worker = true;
  }

  const microk8sFollowerLaunchConfigYaml = YAML.stringify(
    microk8sFollowerLaunchConfig,
  );

  const microk8sVersion = config.infrastructure.cndi?.microk8s?.version ||
    DEFAULT_K8S_VERSION;
  const microk8sChannel = config.infrastructure.cndi?.microk8s?.channel ||
    "stable";

  const WORKING_DIR = "/home/ubuntu/.cndi-runtime";
  const PATH_TO_LAUNCH_CONFIG = `${WORKING_DIR}/launch-config.yaml`;

  // https://cloudinit.readthedocs.io/en/latest/reference/examples.html
  const content = {
    package_update: true,
    package_upgrade: false, // TODO: is package_upgrade:true better?
    packages: [
      "apache2-utils", // TODO: not needed on follower, oh well
      "nfs-common",
    ],
    write_files: [
      {
        path: PATH_TO_LAUNCH_CONFIG,
        content: microk8sFollowerLaunchConfigYaml,
      },
    ],
    runcmd: [
      `echo "cloud-init.runcmd"`,
      `echo "------------------"`,
      `echo "follower bootstrap initializing!"`,
      `echo "------------------"`,
      `echo "cndi-platform begin"`,
      `echo "Installing microk8s"`,

      // the following used to retry every 180 seconds until success:
      loopUntilSuccess(
        `sudo snap install microk8s --classic --channel=${microk8sVersion}/${microk8sChannel}`,
        `snap failed to install 'microk8s'`,
      ),

      `echo "Setting microk8s config"`,
      `sudo snap set microk8s config="$(cat ${PATH_TO_LAUNCH_CONFIG})"`,
      // group "microk8s" is created by microk8s snap
      `echo "Adding ubuntu user to microk8s group"`,
      `sudo usermod -a -G microk8s ubuntu`,

      `echo "Granting ubuntu user access to ~/.kube"`,
      `sudo chown -f -R ubuntu ~/.kube`,

      `echo "Waiting for microk8s to be ready"`,
      `sudo microk8s status --wait-ready`,
      `echo "microk8s is ready"`,

      `echo "cndi-platform end"`,
      `echo "------------------"`,
      `echo "follower bootstrap complete!"`,
    ],
  };

  const contentYaml = YAML.stringify(content);

  return `#cloud-config\n\n${contentYaml}`;
};
export default getFollowerCloudInitYaml;
