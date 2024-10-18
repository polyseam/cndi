# cndi template authoring 📝

CNDI Templates are YAML files with a few properties. Every Template is designed
to deploy a specific Application. CNDI ships with a few Templates including
[Airflow](https://airflow.apache.org) and
[PostgreSQL](https://cloudnative-pg.io), they can be found in
[../templates](../templates/), but we can also create our own Templates, and
that's what this guide will focus on.

## structure

### prompts

The structure of a Template is broken into 3 main sections, the first and the
most unique fields among CNDIs contemporaries is `prompts`. The `prompts`
section is an array of objects, each object represents a question that the user
will be asked when they run `cndi create`. The `prompts` section is optional,
but it is recommended to include it as it will make your Template more
user-friendly.

Each prompt object has the following properties:

- `name` - a unique identifier for the prompt, and a handle to access the
  response in the rest of the Template
- `message` - the message displayed to the user when the prompt is shown
- `type` - the type of input expected from the user [defined below]()
- `default` - the default value for the prompt response
- `options` - an array of options for the user to choose from
- `condition` - a condition that must be met for the prompt to be shown
- `validators` - an array of validator names and options

The `type` field can be one of the following:

- `Input`
- `Secret`
- `Confirm`
- `Toggle`
- `Select`
- `List`
- `Checkbox`
- `Number`
- `File`

Let's look at an example prompts array.

We'll ask the user if they want to enable cert-manager, and if they do, we'll
ask for their email address.

```yaml
prompts:
  - name: enable_cert_manager
    message: Do you want to enable cert-manager?
    type: Confirm
    default: true

  - name: email
    message: Please enter your email address
    type: Input
    default: jane@example.com
    validators:
      - email
    condition:
      - "{{ $cndi.get_prompt_response(enable_cert_manager) }}"
      - ==
      - true
```

The result of this `prompts` array would be a prompt asking the user if they
want to use cert-manager.

```
? Would you like to enable cert-manager? (Y/n) ›
```

If the user presses `enter` they've selected `Y` by default and the next prompt
will be shown.

```
? Please enter your email address: (jane@example.com) ›
```

If the user instead submits `n`, the `email` prompt will be skipped.

One last thing to note before we move on is the
`"{{ $cndi.get_prompt_response(enable_cert_manager) }}"` line, which
demonstrates how we can access the response value of a prompt response by name.
This same syntax will be used to access the response value in the rest of the
Template.

---

### outputs

The `outputs` section is a map of output files which should be templated using
the response values from our `prompts`. The keys of the map are the 3 output
files that CNDI generates as the kernel of each CNDI project:

`readme` : The `README.md` file is the main documentation for your unique
project.

`env` : The `.env` file is a file that contains all the environment variables
and secrets that are needed to run your project.

`cndi_config` : The `cndi-config.yaml` file is the input file for the CNDI CLI.
It contains all the information needed to run your project, except for the
environment variables which can't be in source code.

_bonus_ `extra_files` : The `extra_files` section is a key/value map of relative
filepaths and the content to write in that location. This is useful for writing
additional files that are not part of the core CNDI project structure.

```yaml
# eg.
outputs:
  extra_files:
    ./my-file.txt: |
      This is the
      multiline content of my file
    ./some-other/file.json: https://example.com/some-other-file.json
```

To learn more about [readme](./project-structure.md),
[env](./project-structure.md), and [cndi_config](./project-structure.md), you
can check out the [CNDI Project Structure](./project-structure.md) section of
the docs.

---

### blocks

The `blocks` section is an array of objects, each object represents a block of
content. This content can be any fragment of YAML.

For an example of `blocks` let's look at how the `airflow` Template uses
`blocks` to define the `airflow-git-credentials` Secret.

```yaml
prompts:
  - name: airflow_share_credentials
    message: Do you want to use your cluster credentials to fetch DAGs?
    type: Confirm
    default: false

blocks:
  - name: git_sync_dedicated
    content:
      apiVersion: v1
      kind: Secret
      metadata:
        name: airflow-git-credentials
        namespace: airflow
      stringData:
        GIT_SYNC_USERNAME: $cndi_on_ow.seal_secret_from_env_var(GIT_SYNC_USERNAME)
        GIT_SYNC_PASSWORD: $cndi_on_ow.seal_secret_from_env_var(GIT_SYNC_PASSWORD)

  - name: git_sync_shared
    content:
      apiVersion: v1
      kind: Secret
      metadata:
        name: airflow-git-credentials
        namespace: airflow
      stringData:
        GIT_SYNC_USERNAME: $cndi_on_ow.seal_secret_from_env_var(GIT_USERNAME)
        GIT_SYNC_PASSWORD: $cndi_on_ow.seal_secret_from_env_var(GIT_TOKEN)
outputs:
  cndi_config:
    cluster_manifests:
      $cndi.comment(airflow-git-sync-secret): Airflow Credentials
      git-sync-credentials-secret:
      $cndi.get_block(git_sync_dedicated):
        condition:
          - "{{ $cndi.get_prompt_response(airflow_share_credentials) }}"
          - ==
          - false
      $cndi.get_block(git_sync_shared):
        condition:
          - "{{ $cndi.get_prompt_response(airflow_share_credentials) }}"
          - ==
          - true
```

In this example, we have two blocks, `git_sync_dedicated` and `git_sync_shared`,
and depending on the value of the `airflow_share_credentials` prompt, we will
use one of the blocks in the `cndi_config` section.

The key takeaway here is that blocks allow us to define reusable fragments of
YAML which can be conditionally inserted based on `prompt` responses.

---

## summary

This document has covered the structure of a CNDI Template, including `prompts`,
`outputs`, and `blocks`. Armed with this knowledge, you should be able to create
your own CNDI Templates and deploy them using the CNDI CLI.

## getting help ❤️

To learn more about writing Templates, please take a look at the ones we've
provided in the [/templates](/templates/) directory, and feel free to reach out
to us on [Discord](https://discord.com/invite/ygt2rpegJ5) or create a
[new issue](https://github.com/polyseam/cndi/issues/new/choose) if you need a
hand, we want more Templates in the world and we are here to help you create
them. 🚀
