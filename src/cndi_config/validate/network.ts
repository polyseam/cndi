import { ccolors } from "deps";
import { ErrOut } from "errout";
import { CNDIConfigSpec } from "../types.ts";
import * as netutils from "src/utils/net.ts";

const label = ccolors.faded("\nsrc/cndi_config/validate/network.ts:");

export function validateCNDIConfigSpecComponentNetwork(
  configSpec: CNDIConfigSpec,
  { pathToConfig }: { pathToConfig: string },
): ErrOut | void {
  const netconfig = configSpec.infrastructure?.cndi?.network;

  if (!netconfig) return;

  const netconfigEmpty = Object.keys(netconfig).length < 1;
  if (netconfigEmpty) return;

  if (!netconfig.mode || netconfig.mode === "create") {
    return validateCNDIConfigSpecComponentNetworkModeCreate(
      configSpec,
      { pathToConfig },
    );
  }

  if (netconfig.mode === "insert") {
    return validateCNDIConfigSpecComponentNetworkModeInsert(
      configSpec,
      { pathToConfig },
    );
  }

  return new ErrOut(
    [
      ccolors.error("cndi_config file found was at "),
      ccolors.user_input(`"${pathToConfig}"\nwith`),
      ccolors.error(
        "cndi_config.infrastructure.cndi.network",
      ),
      ccolors.error("but the"),
      ccolors.key_name('"mode"'),
      ccolors.error("key must be either"),
      ccolors.key_name('"create"'),
      ccolors.error(","),
      ccolors.key_name('"insert"'),
      ccolors.error("or ommitted"),
    ],
    {
      code: 1,
      id: "validate/cndi_config/!network[mode]",
      label,
    },
  );
}

function validateCNDIConfigSpecComponentNetworkModeCreate(
  configSpec: CNDIConfigSpec,
  { pathToConfig }: { pathToConfig: string },
): ErrOut | void {
  let subnetError;

  const nc = configSpec.infrastructure?.cndi?.network!;

  if (nc?.network_identifier) {
    return new ErrOut(
      [
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"\nwith`),
        ccolors.error(
          "cndi_config.infrastructure.cndi.network",
        ),
        ccolors.error("in"),
        ccolors.key_name('"create"'),
        ccolors.error("mode"),
        ccolors.error("but the"),
        ccolors.key_name('"network_identifier"'),
        ccolors.error("key should not be set"),
      ],
      {
        code: 932,
        id: "validate/cndi_config/!network[network_identifier]",
        label,
      },
    );
  } else if (nc?.subnets) {
    if (nc.subnets.public) {
      for (const subnet of nc.subnets.public) {
        subnetError = validateCreateModeSubnetString(
          configSpec,
          { pathToConfig },
        )(subnet);
        if (subnetError) return subnetError;
      }
    }
    if (nc.subnets.private) {
      for (const subnet of nc.subnets.private) {
        subnetError = validateCreateModeSubnetString(
          configSpec,
          { pathToConfig },
        )(subnet);
        if (subnetError) return subnetError;
      }
    }
  }
}

const validateCreateModeSubnetString =
  (configSpec: CNDIConfigSpec, { pathToConfig }: { pathToConfig: string }) =>
  (subnet: string): ErrOut | void => {
    const nc = configSpec.infrastructure?.cndi?.network!;
    const networkAddressSpace = nc.network_address_space;
    let subnetError: ErrOut | undefined;

    const subnetIsValidAddressSpace = netutils.isValidAddressSpace(
      subnet,
    );

    if (!subnetIsValidAddressSpace) {
      return new ErrOut(
        [
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"\nwith`),
          ccolors.error(
            "cndi_config.infrastructure.cndi.network",
          ),
          ccolors.error("in"),
          ccolors.key_name('"create"'),
          ccolors.error("mode"),
          ccolors.error("but the"),
          ccolors.key_name('"subnets"'),
          ccolors.error("key contains an invalid subnet"),
        ],
        {
          code: 1,
          id: "validate/cndi_config/!network[subnets]",
          label,
        },
      );
    }

    const isContainedInNetworkAddressSpace = !networkAddressSpace ||
      netutils.addressSpaceContainsSubspace(
        networkAddressSpace,
        subnet,
      );

    if (!isContainedInNetworkAddressSpace) {
      return new ErrOut(
        [
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"\nwith`),
          ccolors.error(
            "cndi_config.infrastructure.cndi.network",
          ),
          ccolors.error("in"),
          ccolors.key_name('"create"'),
          ccolors.error("mode"),
          ccolors.error("but the"),
          ccolors.key_name('"subnets"'),
          ccolors.error("key contains a subnet"),
          ccolors.user_input(`"${subnet}"`),
          ccolors.error("that is not contained in the provided"),
          ccolors.error('"network.network_address_space"'),
          ccolors.user_input(
            `"${networkAddressSpace}"`,
          ),
        ],
        {
          code: 1,
          id: "validate/cndi_config/!network[subnets]",
          label,
        },
      );
    }

    const allSubnets = [
      ...nc.subnets?.public || [],
      ...nc.subnets?.private || [],
    ];

    const subnetsDoNotOverlap = allSubnets.every(
      (otherSubnet: string) => {
        if (netutils.addressSpaceOverlaps(subnet, otherSubnet)) {
          subnetError = new ErrOut(
            [
              ccolors.error("cndi_config file found was at "),
              ccolors.user_input(`"${pathToConfig}"\nwith`),
              ccolors.error(
                "cndi_config.infrastructure.cndi.network",
              ),
              ccolors.error("in"),
              ccolors.key_name('"create"'),
              ccolors.error("mode"),
              ccolors.error("but the"),
              ccolors.key_name('"subnets"'),
              ccolors.error("key contains overlapping subnets"),
              ccolors.user_input(`"${subnet}"`),
              ccolors.error("and"),
              ccolors.user_input(`"${otherSubnet}"`),
              ccolors.error("are overlapping"),
            ],
            {
              code: 1,
              id: "validate/cndi_config/!network[subnets]",
              label,
            },
          );
          return false;
        }
      },
    );
    if (!subnetsDoNotOverlap) {
      return subnetError;
    }
  };

export function validateCNDIConfigSpecComponentNetworkModeInsert(
  configSpec: CNDIConfigSpec,
  { pathToConfig }: { pathToConfig: string },
): ErrOut | void {
  // deno-lint-ignore no-explicit-any
  const nc = configSpec.infrastructure?.cndi?.network as any;
  const provider = configSpec.provider;

  if (!nc.network_identifier) {
    return new ErrOut(
      [
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"\nwith`),
        ccolors.error(
          "cndi_config.infrastructure.cndi.network",
        ),
        ccolors.error("in"),
        ccolors.key_name('"insert"'),
        ccolors.error("mode"),
        ccolors.error("but is missing the"),
        ccolors.key_name('"network_identifier"'),
        ccolors.error("key"),
      ],
      {
        code: 931,
        id: "validate/cndi_config/!network[id]",
        label,
      },
    );
  }

  if (
    !Object.keys(nc.subnets).includes("public") &&
    !Object.keys(nc.subnets).includes("private")
  ) {
    return new ErrOut(
      [
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"\nwith`),
        ccolors.error(
          "cndi_config.infrastructure.cndi.network",
        ),
        ccolors.error("in"),
        ccolors.key_name('"insert"'),
        ccolors.error("mode"),
        ccolors.error("but the"),
        ccolors.key_name('"subnets"'),
        ccolors.error("key is missing both"),
        ccolors.key_name('"public"'),
        ccolors.error("and"),
        ccolors.key_name('"private"'),
        ccolors.error("subnet identifiers"),
      ],
      {
        code: 1,
        id: "validate/cndi_config/!network[subnets]",
        label,
      },
    );
  }

  for (const subnet of nc.subnets.private) {
    if (typeof subnet !== "string") {
      return new ErrOut(
        [
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"\nwith`),
          ccolors.error(
            "cndi_config.infrastructure.cndi.network",
          ),
          ccolors.error("in"),
          ccolors.key_name('"insert"'),
          ccolors.error("mode"),
          ccolors.error("but the"),
          ccolors.key_name('"subnets.private"'),
          ccolors.error(
            "key contains a subnet identifier that is not a string",
          ),
        ],
        {
          code: 1,
          id: "validate/cndi_config/!network[subnets]",
          label,
        },
      );
    }

    if (netutils.isValidAddressSpace(subnet)) {
      return new ErrOut(
        [
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"\nwith`),
          ccolors.error(
            "cndi_config.infrastructure.cndi.network",
          ),
          ccolors.error("in"),
          ccolors.key_name('"insert"'),
          ccolors.error("mode"),
          ccolors.error("but the"),
          ccolors.key_name('"subnets.private"'),
          ccolors.error(
            "key contains a subnet address space instead of a subnet identifier",
          ),
        ],
        {
          code: 1,
          id: "validate/cndi_config/!network[subnets]",
          label,
        },
      );
    }

    if (
      !subnetIdentifierIsValid(subnet, provider)
    ) {
      return new ErrOut(
        [
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"\nwith`),
          ccolors.error(
            "cndi_config.infrastructure.cndi.network",
          ),
          ccolors.error("in"),
          ccolors.key_name('"insert"'),
          ccolors.error("mode"),
          ccolors.error("but the"),
          ccolors.key_name('"subnets.private"'),
          ccolors.error("key contains an invalid subnet identifier"),
          ccolors.user_input(`"${subnet}"`),
        ],
        {
          code: 1,
          id: "validate/cndi_config/!network[subnets]",
          label,
        },
      );
    }
  }
  for (const subnet of nc.subnets.public) {
    if (typeof subnet !== "string") {
      return new ErrOut(
        [
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"\nwith`),
          ccolors.error(
            "cndi_config.infrastructure.cndi.network",
          ),
          ccolors.error("in"),
          ccolors.key_name('"insert"'),
          ccolors.error("mode"),
          ccolors.error("but the"),
          ccolors.key_name('"subnets.public"'),
          ccolors.error(
            "key contains a subnet identifier that is not a string",
          ),
        ],
        {
          code: 1,
          id: "validate/cndi_config/!network[subnets]",
          label,
        },
      );
    }

    if (netutils.isValidAddressSpace(subnet)) {
      return new ErrOut(
        [
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"\nwith`),
          ccolors.error(
            "cndi_config.infrastructure.cndi.network",
          ),
          ccolors.error("in"),
          ccolors.key_name('"insert"'),
          ccolors.error("mode"),
          ccolors.error("but the"),
          ccolors.key_name('"subnets.public"'),
          ccolors.error(
            "key contains a subnet address space instead of a subnet identifier",
          ),
        ],
        {
          code: 1,
          id: "validate/cndi_config/!network[subnets]",
          label,
        },
      );
    }

    if (
      !subnetIdentifierIsValid(subnet, provider)
    ) {
      return new ErrOut(
        [
          ccolors.error("cndi_config file found was at "),
          ccolors.user_input(`"${pathToConfig}"\nwith`),
          ccolors.error(
            "cndi_config.infrastructure.cndi.network",
          ),
          ccolors.error("in"),
          ccolors.key_name('"insert"'),
          ccolors.error("mode"),
          ccolors.error("but the"),
          ccolors.key_name('"subnets.public"'),
          ccolors.error("key contains an invalid subnet identifier"),
          ccolors.user_input(`"${subnet}"`),
        ],
        {
          code: 1,
          id: "validate/cndi_config/!network[subnets]",
          label,
        },
      );
    }
  }
}

function subnetIdentifierIsValid(
  subnetIdentifier: string,
  provider: string,
): boolean {
  switch (provider) {
    case "aws":
      return subnetIdentifier.startsWith("subnet-");
    case "azure":
      return subnetIdentifier.split("/").includes("subnets");
    case "gcp":
      return true;
    default:
      return false; // Unsupported provider or invalid subnet identifier format
  }
}
