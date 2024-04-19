# cndi outputs 📂

When `cndi create` is called it bootstraps the following files and folders:

1. a `cndi_config.yaml` - this file is the core of your CNDI project, for more
   details we have a dedicated [cndi_config Guide](./config.md). In short, it
   contains all of the ingredients for your project. It describes the hardware
   you will use, the software you will install, and how it should be configured.
   If you understand this file, you understand CNDI.

2. a `.env` file which contains all of your sensitive values that CNDI will use,
   this includes secret values to be used in your cluster, and credentials to be
   used during deployment consumed by `cndi run`. The syntax of this file is
   sometimes refered to as [dotenv](https://www.dotenv.org/docs/security/env).

3. a `./README.md` file that explains how you can use your new project
   repository, with information about your Template and where it is being
   deployed

4. a `.github/workflows` folder, with a
   [GitHub Action Workflow](https://docs.github.com/en/actions/using-workflows/about-workflows)
   inside. The workflow is mostly just wrapping the `cndi run` command from the
   `cndi` binary executable. As such, if you use a different CI system, you can
   call the `cndi run` command there instead. The workflow is configured to run
   on every push to the `main` branch.

5. a `cndi/terraform` folder, containing files that CNDI has generated for
   [terraform](https://terraform.io) which describe the infrastructure to be
   deployed, which CNDI will apply automatically when `cndi run` is executed.

6. a `cndi/cluster_manifests` folder, containing
   [Kubernetes](https://kubernetes.io) manifests that will be applied by
   [ArgoCD](https://argo-cd.readthedocs.io/en/stable/) in your new cluster when
   it is up and running. This includes manifests like the
   '[Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)',
   likely already present the `cluster_manifests` section of your
   `cndi_config.yaml`.

7. a `cndi/cluster_manifests/applications` folder, which contains a folder for
   each Application defined in the `applications` section of your
   `cndi_config.yaml` alongside a number of core applications like
   [cert-manager](/src/outputs/core-applications/cert-manager.application.yaml.ts),
   [external-dns](/src/outputs/core-applications/external-dns.application.yaml.ts),
   [reloader](/src/outputs/core-applications/reloader.application.yaml.ts), and
   [nginx-ingress]()

8. a `.gitginore` file to ensure secret values never get published as source
   files to your repo
