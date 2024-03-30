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
        - '{{ $cndi.get_prompt_response(deploy_airflow_ingress) }}'
        - ==
        - true
```
