# use-template

Templates are used to define and interactively configure the deployment of
cloud-native applications.

CNDI Templates are written as YAML files. The CNDI Team maintains a few
[Templates](/templates) and browsing those may be the quickest path to
understanding them.

Calling
`cndi init --interactive --template https://raw.githubusercontent.com/cndi/templates/main/basic.yaml --create`
will initialize a new repository with the Basic Template.

The consumption of a Template yields Terraform Resources and Kubernetes
manifests. These outputs are files written to disk. Templates also yield a
README.md about how to operate your new cluster, and a workflow file which will
kick off automation to deploy the resources. When you initialize a new cluster
using a Template, it will help you create a new repository on GitHub, where your
cluster can be managed.

## Choosing a Template

Generally CNDI is at it's best when it is used to deploy what we call "Commodity
Templates". These are templates that are used to deploy common applications,
such as databases, message queues, and web servers.

CNDI Templates exist for a few applications already. On top of providing a
convenient interactive experience, Templates leverage GitOps and Infrastructure
as Code best practices.

The CNDI Template will bootstrap a new repository, and configure it to deploy
the application. The repository will be configured to use GitHub Actions to
deploy the application, and will be configured to use Terraform Cloud to manage
the infrastructure.

Every CNDI Template has a `prompts` key, which is an array of prompts that will
be presented to the user when the Template is used. When the Template is
consumed uninteractively, the prompts will not be displayed and the default
values will be used.

We can use `{{ $cndi.get_prompt_response(<prompt_name>) }}` to reference the
response to a prompt. This can be used to conditionally display prompts, or
otherwise templated into the

```yaml
prompts:
  - name: deploy_airflow_ingress
    message: "Do you want to deploy an Ingress for the Airflow webserver?"
    default: true
    type: Confirm

  - name: airflow_hostname
    message: What public hostname should be used for the Airflow webserver?
    default: "airflow.example.com"
    type: "Input"
    validators:
      - hostname
    condition:
      - "{{ $cndi.get_prompt_response(deploy_airflow_ingress) }}"
      - ==
      - true
```

## macros

CNDI Templates are YAML files, and they are invoked during `cndi init` or
`cndi create`.

Template invocation can happen interactively, or uninteractively.

In interactive mode, the user is prompted for values for each prompt in the
`prompts` array of the Template YAML.

In non-interactive mode, the user can pass values for each prompt as flags to
the `cndi init` or `cndi create` like `--set my_prompt_response="my value"`, and
all other responses will fall back to the default specified in each prompt array
entry.

After a successful Template invocation, there should be no pairs of `{{}}` left
in the output files. The code within these braces is called a invocation-time
macro, and there are only a few.

### `{{ $cndi.get_prompt_response(<prompt_name>) }}`

This macro is used to reference the response to a prompt. This can be used to
conditionally display prompts, or otherwise templated into the output files.

### `{{ $cndi.get_block(<identifier>) }}`

This macro is used to insert a YAML fragment into the space where it is called.
This is useful for inserting a block of YAML into a Kubernetes manifest, or
Terraform resource, especially where you may want to conditionally include or
exclude a block of YAML.

This call is also used slightly different depending on where it is being
invoked. If the `{{ $cndi.get_block(<identifier>) }}` is called in your
`cndi_config` output file, it will expect to recieve a YAML fragment, and that
fragment replaces the call. If the `{{ $cndi.get_block(<identifier>) }}` is set
to run conditionally and no blocks pass the condition, CNDI will delete the node
that the macro is called in.

If the `{{ $cndi.get_block(<identifier>) }}` is called in the `env` block, it
will expect to recieve a flat YAML fragment of key-value pairs, and those
key-value pairs will be added to the `env` block of the resource.

If the `{{ $cndi.get_block(<identifier>) }}` is called in the `readme` block it
will throw an error, you should instead use
`{{ $cndi.get_string(<identifier>) }}`;

### `{{ $cndi.get_string(<identifier>) }}`

This macro is used to insert a string into the space where it is called. This is
only available in the `readme` block of your Template.

### `{{ $cndi.get_comment(<identifier>) }}`

This macro is used to insert a comment into the space where it is called. When
you want to add a comment for the maintainers of a Template, you can simply
create a YAML comment using `#`. However if you want to insert a comment into
the product of a template you can use this macro as the key, then the value will
be the comment you want to insert.

```yaml
outputs:
  env:
    # this comment is for template maintainers
    $cndi.comment(title): "This line will show up in the .env file for template consumers"
    NOTEWORTHY: "{{ $cndi.get_prompt_response(title) }}"
```

### `{{ $cndi.get_random_string(<length>) }}`

This macro is used to generate a random string of a given length. This is useful
for generating default passwords or other secrets.

```yaml
prompts:
  - name: db_password
    message: "What password should be used for the database?"
    default: "{{ $cndi.get_random_string(16) }}"
    type: "Password"
```
