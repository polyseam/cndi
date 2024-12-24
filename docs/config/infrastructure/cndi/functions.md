# `functions`

## `cndi.infrastructure.functions`

The `functions` block is used to configure the functions runtime for your
cluster. The only value which can be customized today is the `hostname` on which
to make it accessible. If the `hostname` is absent we will not generate the
Ingress resource for you, but will still provision your functions should there
exist any valid functions in the local `./functions` directory.

In order to define functions for your cluster, you must create a directory
called `functions` in the root of your project. Inside this directory, the
folder structure should be as follows:

```tree
cndi_config.yaml
functions/
├── foo/
│   └── index.ts
└── bar/
    └── index.ts
```

Given a folder structure like the one above CNDI will ensure that the `foo` and
`bar` functions are deployed to your cluster, powered by
[Supabase's EdgeRuntime](https://github.com/supabase/edge-runtime).

With a `functions` block like this:

```yaml
project_name: my-cluster
cndi_version: v2
provider: aws
distribution: eks
infrastructure:
  cndi:
    external_dns:
      provider: aws
    functions:
      hostname: functions.my-cluster.example.com
    nodes: [...]
```

Your functions will be automatically built and deployed with each push to git,
accessible on the path of the provided host:

- `https://functions.my-cluster.example.com/foo`
- `https://functions.my-cluster.example.com/bar`

`cndi` is responsible for building and deploying your functions, but you are
responsible for writing the functions themselves.

For examples of written functions checkout
[https://github.com/polyseam/fns-examples](https://github.com/polyseam/fns-examples)

To learn more about the CNDI Functions feature, check out the
[Functions doc](/docs/functions.md).
