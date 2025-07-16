import { ccolors } from "deps";
import { ErrOut } from "errout";
import {
  CNDIConfigSpec,
  CNDINetworkConfigCreate,
  CNDINetworkConfigInsert,
} from "../types.ts";
import * as netutils from "src/utils/net.ts";
import { DEFAULT_NETWORK_ADDRESS_SPACE } from "consts";

const label = ccolors.faded("\nsrc/cndi_config/validate/network.ts:");

export function validateCNDIConfigSpecComponentNetwork(
  configSpec: CNDIConfigSpec,
  { pathToConfig }: { pathToConfig: string },
): ErrOut | void {
  const netconfig = configSpec.infrastructure?.cndi?.network;

  if (!netconfig) return;

  const netconfigEmpty = Object.keys(netconfig).length < 1;
  if (netconfigEmpty) return;

  if (!netconfig?.mode || netconfig.mode === "create") {
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

  const nc = configSpec.infrastructure?.cndi
    ?.network! as CNDINetworkConfigCreate;

  if (nc?.network_address_space) {
    if (!netutils.isValidAddressSpace(nc.network_address_space)) {
      return new ErrOut([
        ccolors.error("cndi_config file found was at "),
        ccolors.user_input(`"${pathToConfig}"\nwith`),
        ccolors.error(
          "cndi_config.infrastructure.cndi.network",
        ),
        ccolors.error("in"),
        ccolors.key_name('"create"'),
        ccolors.error("mode"),
        ccolors.error("but the"),
        ccolors.key_name('"network_address_space"'),
        ccolors.error("key contains an invalid address space"),
      ], {
        code: 1,
        label,
        id: "validate/cndi_config/network_address_space/!isValid",
      });
    }
  }

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
  } else if (nc?.subnet_address_spaces) {
    if (nc.subnet_address_spaces.public) {
      for (const subnet of nc.subnet_address_spaces.public) {
        subnetError = validateCreateModeSubnetString(
          configSpec,
          { pathToConfig },
        )(subnet);
        if (subnetError) return subnetError;
      }
    }
    if (nc.subnet_address_spaces.private) {
      for (const subnet of nc.subnet_address_spaces.private) {
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
  (subnetAddressSpace: string): ErrOut | void => {
    const nc = configSpec.infrastructure?.cndi
      ?.network! as CNDINetworkConfigCreate;
    const networkAddressSpace = nc.network_address_space ||
      DEFAULT_NETWORK_ADDRESS_SPACE;

    let subnetError: ErrOut | undefined;

    const subnetIsValidAddressSpace = netutils.isValidAddressSpace(
      subnetAddressSpace,
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
        subnetAddressSpace,
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
          ccolors.user_input(`"${subnetAddressSpace}"`),
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
      ...nc.subnet_address_spaces?.public || [],
      ...nc.subnet_address_spaces?.private || [],
    ];

    const subnetsDoNotOverlap = allSubnets.every(
      (otherSubnet: string) => {
        if (netutils.addressSpaceOverlaps(subnetAddressSpace, otherSubnet)) {
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
              ccolors.user_input(`"${subnetAddressSpace}"`),
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
  const nc = configSpec.infrastructure?.cndi
    ?.network as CNDINetworkConfigInsert;
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
    !Object.keys(nc?.subnet_identifiers || {}).includes("public") &&
    !Object.keys(nc?.subnet_identifiers || {}).includes("private")
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
        ccolors.key_name('"subnet_identifiers"'),
        ccolors.error("key is missing both"),
        ccolors.key_name('"public"'),
        ccolors.error("and"),
        ccolors.key_name('"private"'),
        ccolors.error("subnet identifiers"),
      ],
      {
        code: 1,
        id: "validate/cndi_config/!network[subnet_identifiers]",
        label,
      },
    );
  }

  const insertModeSubnets: string[] = [];

  const privateSubnetIdentifiers = nc?.subnet_identifiers?.private || [];
  const publicSubnetIdentifiers = nc?.subnet_identifiers?.public || [];

  for (const privateSubnetId of privateSubnetIdentifiers) {
    if (typeof privateSubnetId !== "string") {
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
          ccolors.key_name('"subnet_identifiers.private"'),
          ccolors.error(
            "key contains a subnet identifier that is not a string",
          ),
        ],
        {
          code: 1,
          id: "validate/cndi_config/!network[subnet_identifiers]",
          label,
        },
      );
    }

    if (netutils.isValidAddressSpace(privateSubnetId)) {
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
          ccolors.key_name('"subnet_identifiers.private"'),
          ccolors.error(
            "key contains a subnet address space instead of a subnet identifier",
          ),
        ],
        {
          code: 1,
          id: "validate/cndi_config/!network[subnet_identifiers]",
          label,
        },
      );
    }

    if (
      !subnetIdentifierIsValid(privateSubnetId, provider)
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
          ccolors.key_name('"subnet_identifiers.private"'),
          ccolors.error("key contains an invalid subnet identifier"),
          ccolors.user_input(`"${privateSubnetId}"`),
        ],
        {
          code: 1,
          id: "validate/cndi_config/!network[subnet_identifiers]",
          label,
        },
      );
    } else {
      insertModeSubnets.push(privateSubnetId);
    }
  }

  for (const publicSubnetId of publicSubnetIdentifiers) {
    if (typeof publicSubnetId !== "string") {
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
          ccolors.key_name('"subnet_identifiers.public"'),
          ccolors.error(
            "key contains a subnet identifier that is not a string",
          ),
        ],
        {
          code: 1,
          id: "validate/cndi_config/!network[subnet_identifiers]",
          label,
        },
      );
    }

    if (netutils.isValidAddressSpace(publicSubnetId)) {
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
      !subnetIdentifierIsValid(publicSubnetId, provider)
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
          ccolors.user_input(`"${publicSubnetId}"`),
        ],
        {
          code: 1,
          id: "validate/cndi_config/!network.subnet_identifiers.public",
          label,
        },
      );
    } else {
      insertModeSubnets.push(publicSubnetId);
    }
  }

  if (insertModeSubnets.length === 0) {
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
        ccolors.key_name("subnets.private"),
        ccolors.error("and"),
        ccolors.key_name("subnets.public"),
        ccolors.error("do not contain subnet ids"),
      ],
      {
        code: 1,
        id: "validate/cndi_config/!network[subnets]",
        label,
      },
    );
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
