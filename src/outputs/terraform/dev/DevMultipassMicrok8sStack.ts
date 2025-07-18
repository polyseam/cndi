import {
  App,
  CDKTFProviderLocal,
  Construct,
  Fn,
  stageCDKTFStack,
  TerraformOutput,
} from "cdktf-deps";

import {
  getCDKTFAppConfig,
  patchAndStageTerraformFilesWithInput,
  resolveCNDIPorts,
  useSshRepoAuth,
} from "src/utils.ts";
import { CNDIConfig, MultipassNodeItemSpec } from "src/types.ts";
import { CNDITerraformStack } from "../CNDICoreTerraformStack.ts";
import { LARSTOBI_MULTIPASS_PROVIDER_VERSION } from "versions";
import { ccolors, deepMerge } from "deps";

const LOCAL_CLOUDINIT_FILE_NAME =
  "microk8s-cloud-init-leader.sensitive.yml.tftpl";

const devMultipassMicrok8sStackLabel = ccolors.faded(
  "src/outputs/terraform/dev/DevMultipassMicrok8sStack.ts:",
);

import { ErrOut } from "errout";

export class DevMultipassMicrok8sStack extends CNDITerraformStack {
  constructor(scope: Construct, name: string, cndi_config: CNDIConfig) {
    super(scope, name, cndi_config);
    const _project_name = this.locals.cndi_project_name.asString;
    const _open_ports = resolveCNDIPorts(cndi_config);

    const nodes = cndi_config.infrastructure.cndi.nodes;

    const numberOfNodes = nodes.length;

    if (numberOfNodes !== 1) {
      console.warn("dev clusters must have exactly one node");
    }

    const node = nodes[0] as MultipassNodeItemSpec;

    new CDKTFProviderLocal.provider.LocalProvider(
      this,
      "cndi_local_provider",
      {},
    );

    let userData;

    if (useSshRepoAuth()) {
      userData = Fn.templatefile(
        "microk8s-cloud-init-leader.yml.tftpl",
        {
          bootstrap_token: this.locals.bootstrap_token.asString!,
          git_repo_encoded: Fn.base64encode(
            this.variables.git_repo.stringValue,
          ),
          git_repo: this.variables.git_repo.stringValue,
          git_ssh_private_key: Fn.base64encode(
            this.variables.git_ssh_private_key.stringValue,
          ),
          sealed_secrets_private_key: Fn.base64encode(
            this.variables.sealed_secrets_private_key.stringValue,
          ),
          sealed_secrets_public_key: Fn.base64encode(
            this.variables.sealed_secrets_public_key.stringValue,
          ),
          argocd_admin_password:
            this.variables.argocd_admin_password.stringValue,
        },
      );
    } else {
      userData = Fn.templatefile("microk8s-cloud-init-leader.yml.tftpl", {
        bootstrap_token: this.locals.bootstrap_token.asString!,
        git_repo: this.variables.git_repo.stringValue,
        git_token: this.variables.git_token.stringValue,
        git_username: this.variables.git_username.stringValue,
        sealed_secrets_private_key: Fn.base64encode(
          this.variables.sealed_secrets_private_key.stringValue,
        ),
        sealed_secrets_public_key: Fn.base64encode(
          this.variables.sealed_secrets_public_key.stringValue,
        ),
        argocd_admin_password: this.variables.argocd_admin_password.stringValue,
      });
    }

    new CDKTFProviderLocal.sensitiveFile.SensitiveFile(
      this,
      "cndi_local_sensitive_file_cloud_init",
      {
        content: userData,
        filename: LOCAL_CLOUDINIT_FILE_NAME,
      },
    );

    new TerraformOutput(this, "cndi_dev_tutorial", {
      value: `
          Accessing ArgoCD UI

          1. Get the IP address of the node
          run: multipass exec ${node.name} -- ip route get 1.2.3.4 | awk '{print $7}' | tr -d '\\n'

          2. Port forward the argocd-server service
          run: multipass exec ${node.name} -- sudo microk8s kubectl port-forward svc/argocd-server -n argocd 8080:443 --address <ip address of node>

          3. Login in the browser
          open: https://<ip address of node>:8080 in your browser to access the argocd UI
      `,
    });
  }
}

const isValidMultipassCapacityString = (str: string): boolean => {
  const suffix = str.slice(-1);
  const number = str.slice(0, -1);

  if (suffix === "G" || suffix === "M" || suffix === "K") {
    return !Number.isNaN(parseInt(number));
  }
  return false;
};

export default function getMultipassResource(
  cndi_config: CNDIConfig,
) {
  if (cndi_config.infrastructure.cndi.nodes.length !== 1) {
    throw new Error(
      [
        devMultipassMicrok8sStackLabel,
        ccolors.error("dev clusters must have exactly one node"),
      ].join(" "),
      {
        cause: 4777,
      },
    );
  }
  const node = cndi_config.infrastructure.cndi
    .nodes[0] as MultipassNodeItemSpec;
  const { name } = node;
  const DEFAULT_DISK_SIZE = 128;
  const DEFAULT_CPUS = 4;
  const DEFAULT_MEMORY = 4;
  const suffix = "G";
  const cpus = node?.cpus || DEFAULT_CPUS;

  const userSpecifiedMemory = !!node?.memory;
  const userMemoryIsInt = !isNaN(Number(node?.memory!));

  let memory = `${DEFAULT_MEMORY}${suffix}`; // 4G

  if (userSpecifiedMemory) {
    if (userMemoryIsInt) {
      memory = `${node.memory}${suffix}`; // assume G
    } else {
      if (isValidMultipassCapacityString(`${node.memory!}`)) {
        memory = `${node.memory!}`; // eg. 500G | 5000M | 100000K
      } else {
        // TODO: fail validation here?
        console.error(
          ccolors.warn(`Invalid multipass node memory value:`),
          ccolors.user_input(`"${node.memory!}"`),
        );
      }
    }
  }

  let disk = `${DEFAULT_DISK_SIZE}${suffix}`; // 128G

  const userSpecifiedDisk = !!node?.disk;
  const userDiskIsInt = !isNaN(Number(node?.disk!));

  if (userSpecifiedDisk) {
    if (userDiskIsInt) {
      disk = `${node.disk}${suffix}`;
    } else {
      if (isValidMultipassCapacityString(`${node.disk!}`)) {
        disk = `${node.disk!}`;
      } else {
        // TODO: fail validation here?
        console.warn(
          ccolors.warn(`Invalid multipass node disk value:`),
          ccolors.user_input(`"${node.disk!}"`),
        );
      }
    }
  }

  return {
    name,
    cloudinit_file: LOCAL_CLOUDINIT_FILE_NAME,
    cpus,
    disk,
    memory,
    depends_on: ["local_sensitive_file.cndi_local_sensitive_file_cloud_init"],
  };
}

export async function stageTerraformSynthDevMultipassMicrok8s(
  cndi_config: CNDIConfig,
): Promise<ErrOut | null> {
  const [errGettingAppConfig, cdktfAppConfig] = await getCDKTFAppConfig();

  if (errGettingAppConfig) return errGettingAppConfig;

  const app = new App(cdktfAppConfig);
  new DevMultipassMicrok8sStack(app as Construct, `_cndi_stack_`, cndi_config);
  const errStagingStack = await stageCDKTFStack(app);

  if (errStagingStack) return errStagingStack;

  const cndi_multipass_instance = getMultipassResource(cndi_config);
  const input = deepMerge({
    resource: {
      multipass_instance: {
        cndi_multipass_instance,
      },
    },
    provider: {
      multipass: {},
    },
    terraform: {
      required_providers: {
        multipass: {
          source: "larstobi/multipass",
          version: LARSTOBI_MULTIPASS_PROVIDER_VERSION,
        },
      },
    },
  }, {
    ...cndi_config?.infrastructure?.terraform,
  });

  const errorPatchingAndStaging = await patchAndStageTerraformFilesWithInput(
    input,
  );

  if (errorPatchingAndStaging) return errorPatchingAndStaging;
  return null;
}
