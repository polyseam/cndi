# blocks

This directory contains a set of CNDI Blocks which can be plugged into your
Templates. Remember that each one should be requested using the
`{{ $cndi.get_block(<identifier>) }}` macro, and that using the GitHub Raw URL
is the best way to reference these.

```yaml
outputs:
  cndi_config:
    cluster_manifests: # it may be wise to use a commit SHA in place of "main"
      my_ingress: "{{ $cndi.get_block(https://raw.githubusercontent.com/polyseam/cndi/main/blocks/common/cluster/default-ingress.yaml) }}"
```
