import { assert, describe, it } from "test-deps";
import getNginxApplicationManifest from "src/outputs/cluster_manifests/core-applications/public-nginx.application.yaml.ts";
import { loadCndiConfig } from "src/utils.ts";
import { YAML } from "deps";
import getProjectRootDir from "get-project-root";

const [err, loadConfigResult] = await loadCndiConfig(getProjectRootDir());

if (err) {
  throw err;
}

const { config } = loadConfigResult;
type ParsedManifest = {
  kind: string;
  spec: { source: { helm: { values: string } } };
};

describe("public-nginx.application.yaml", () => {
  describe("default configuration", () => {
    const basicNginxManifest = getNginxApplicationManifest(config);
    let parsedManifest: {
      kind: string;
      spec: { source: { helm: { values: string } } };
    };

    it("should return valid YAML", () => {
      parsedManifest = YAML.parse(basicNginxManifest) as ParsedManifest;
    });

    it("should be a valid 'Application' Kubernetes manifest", () => {
      assert(parsedManifest.kind === "Application");
    });

    it("should have a valid YAML string for values", () => {
      const values = parsedManifest.spec.source.helm.values;
      assert(YAML.parse(values));
    });

    it("should not have open tcp ports", () => {
      const values = YAML.parse(
        parsedManifest.spec.source.helm.values,
      ) as { tcp: Record<string, string> };

      if (values?.tcp) {
        const numberOfTcpPorts = Object.keys(values?.tcp).length;
        assert(numberOfTcpPorts === 0);
      }
    });
  });
  describe("open_ports configuration", () => {
    const open_ports = [
      {
        name: "pg",
        number: 5432,
        namespace: "postgres",
        service: "postgres",
      },
    ];
    const openPortsConfig = {
      ...config,
      infrastructure: {
        ...config.infrastructure,
        cndi: {
          ...config.infrastructure.cndi,
          open_ports,
        },
      },
    };
    const openPortsNginxManifest = getNginxApplicationManifest(
      openPortsConfig,
    );

    const parsedManifest = YAML.parse(openPortsNginxManifest) as ParsedManifest;

    it("should have proper open tcp ports", () => {
      assert(parsedManifest?.spec?.source?.helm?.values);
      const values = YAML.parse(
        parsedManifest.spec.source.helm.values,
      ) as { tcp: Record<string, string> };
      assert(values.tcp);
      assert(Object.keys(values.tcp).length === open_ports.length);

      for (const key in values.tcp) {
        const v = values.tcp[key];
        const open_port = open_ports.find((p) => p.number === parseInt(key));
        assert(open_port);
        assert(typeof v === "string");
        assert(
          v ===
            `${open_port.namespace}/${open_port.service}:${open_port.number}`,
        );
      }
    });
  });
});
