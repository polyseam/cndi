import { NormalizedCNDIConfig } from "src/cndi_config/types.ts";

type LocalsPatchObject = Record<string, string>;
/**
 * Locals implementing the logic from example.hcl (device discovery,
 * leader selection, fingerprints and bootstrap script template)
 */
export default function getLocalsTfJSON(
  _cndi_config: NormalizedCNDIConfig,
): LocalsPatchObject {
  // Build manual node descriptors if provided
  const nodes = _cndi_config.infrastructure.cndi.nodes;
  const isAuto = nodes === "auto" ||
    (Array.isArray(nodes) && nodes.length === 0);

  // For manual mode, construct a JSON array of node maps with id,name,ip
  // where ip uses host if provided. Tags are preserved for later lookup if used.
  const manualDevices = Array.isArray(nodes)
    ? nodes.map((n) => ({
      id: n.name,
      name: n.name,
      ip: n.host ?? "",
      tag: n.tag ?? "",
    }))
    : [];

  const locals = {
    // devices: auto mode reads from data.tailscale_devices.fleet; manual uses the provided hosts
    // Auto mode filters devices by tag:cndi--<project_name> so we only consider nodes tagged for this project
    devices: isAuto
      ? '${[for d in data.tailscale_devices.fleet.devices : { id = d.id, name = d.name, ip = one([for a in d.addresses : a if can(regex("^100\\\\.", a))]) } if length([for t in d.tags : t if t == "cndi--\${var.project_name}"]) > 0 && length([for a in d.addresses : a if can(regex("^100\\\\.", a))]) > 0]}'
      : JSON.stringify(manualDevices),

    // deterministic leader = lowest 100.x address (or first manual with ip)
    leader_ip: isAuto
      ? "${sort(local.devices[*].ip)[0]}"
      : "${jsondecode(local.devices)[0].ip}",
    leader_id: isAuto
      ? "${one([for n in local.devices : n.id if n.ip == local.leader_ip])}"
      : "${jsondecode(local.devices)[0].id}",

    nodes_by_id: isAuto
      ? "${{ for n in local.devices : n.id => n }}"
      : "${{ for n in jsondecode(local.devices) : n.id => n }}",

    node_fingerprints:
      '${{ for id, n in local.nodes_by_id : id => sha256(jsonencode({ role = id == local.leader_id ? "leader" : "worker", k3s_version = var.k3s_version, server_endpoint = local.leader_ip, tls_sans = sort(var.tls_sans), server_extra_args = sort(var.server_extra_args), agent_extra_args = sort(var.agent_extra_args), disable_servicelb = var.disable_servicelb, disable_traefik = var.disable_traefik })) }}',

    k3s_bootstrap: `#!/usr/bin/env bash
set -euo pipefail

ROLE="\${ROLE}"
K3S_VERSION="\${K3S_VERSION}"
K3S_TOKEN="\${K3S_TOKEN}"
SERVER_IP="\${SERVER_IP}"
DISABLE_SVCLB="\${DISABLE_SVCLB}"
DISABLE_TRAEFIK="\${DISABLE_TRAEFIK}"
SERVER_ARGS="\${SERVER_ARGS}"
AGENT_ARGS="\${AGENT_ARGS}"
TLS_SANS="\${TLS_SANS}"
FINGERPRINT="\${FINGERPRINT}"

sudo mkdir -p /etc/cndi
if [ -f /etc/cndi/k3s.fingerprint ] && [ "$(cat /etc/cndi/k3s.fingerprint)" = "$FINGERPRINT" ]; then
  echo "[cndi] remote state already matches desired fingerprint; no-op"
  exit 0
fi

export INSTALL_K3S_CHANNEL="$K3S_VERSION"
export K3S_TOKEN="$K3S_TOKEN"

# Build common flag list
args=()

# Disable built-ins based on desired config
if [ "\${DISABLE_SVCLB}" = "true" ]; then args+=("--disable=servicelb"); fi
if [ "\${DISABLE_TRAEFIK}" = "true" ]; then args+=("--disable=traefik"); fi

# TLS SANs (repeatable)
for san in \${TLS_SANS}; do args+=("--tls-san=\${san}"); done

if [ "\${ROLE}" = "leader" ]; then
  args=("server" "--cluster-init" "\${args[@]}" \${SERVER_ARGS})
  curl -sfL https://get.k3s.io | sh -s - "\${args[@]}"
else
  export K3S_URL="https://\${SERVER_IP}:6443"
  args=("agent" "\${args[@]}" \${AGENT_ARGS})
  curl -sfL https://get.k3s.io | sh -s - "\${args[@]}"
fi

echo "\${FINGERPRINT}" | sudo tee /etc/cndi/k3s.fingerprint >/dev/null
echo "[cndi] applied fingerprint \${FINGERPRINT}"`,
  };

  return locals;
}
