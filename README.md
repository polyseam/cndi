# cndi-next

This is the next version of CNDI. It deploys an entire data stack in minutes.
It's perfect for deploying Data Products consistently that are reliable, discoverable, maintainable, and interoperable, all while remaining flexible to the needs of each Data Product.

## configuration

There are 2 options for configuring your next data stack. The first is to use our online configurator tool, it's live at [configurator.cndi.run] and is probably the most fun. But the config is just a file, so you can also write it by hand if you want.

Let's run through the 4 parts of a `cndi-config.json` file.

### nodes

We specify an array of `node` items. Each node represents a virtual machine we will
create on your behalf. These nodes will become nodes in your Kubernetes cluster, but you don't need to worry about that. You specify how many virtual machines to create in order to run your new data stack, and you specify where they will be deployed, and how powerful they are.

These nodes must each be one of the following `kinds`:

- aws
- azure
- gcp
- local
- remote
- vmware

We also specify the node `role`, this is either `"controller"` or `"worker"`.

Here is an example `cndi-config.json` object that contains a set of nodes to deploy:

```jsonc
{
  "nodes": [
    {
      "kind": "gcp",
      "role": "controller",
      "name": "gcp-controller"
    },
    {
      "kind": "gcp",
      "role": "worker",
      "name": "gcp-worker"
    },
    {
      "kind": "aws", // whoa, multicloud!
      "role": "worker",
      "name": "aws-worker"
    }
  ]
  // tip: we parse this file as JSONC so you can add comments!
}
```

With `nodes` you specify your infrastructure and there are way more options to
choose from, check out the list of node properties [here]()!

## applications

The next thing we need to configure is the applications that will actually run on the cluster. Up until now we have focused on making it a breeze to deploy Airflow in Kubernetes. 

Lets see what that might look like:

```jsonc
{
    "nodes": [...],
    "application": {
        "airflow": {
            /* 
            Our GUI for any of our supported apps is generated from the official Helm Chart's values.schema.json but we've also layered on additional features and customizations to give you the best system for your environment
            */
            "dags": {
                "gitSync": {
                    "enabled": true,
                    "repo":"https://github.com/polyseam/dag-bag"
                }
            },
            /* If you want to customize any Helm values for an application, this is the place to do it! */
            "images": {
                "redis":{
                    "tag": "7-bullseye"
                }
            }
        }
    }
}
```

The last aspect of configuration is related to the Kubernetes cluster we are
going to be deploying, but don't worry, we'll make it easy!

```jsonc
{
    "nodes": [...],
    "application": {...},
    "cluster": {
        "ingress": {
            // if you want to enable SSL, get certificates from Let's Encrypt
            // that's easy just enable cert-manager and give us a host name
            "ssl": true,
            "cert-manager": {
                "enabled": true
            },
            "host": "playlist.example.com",
            // if you want your team to login to the upcoming application through GSuite, piece of cake!
            "oauth-google": {
                "client_id": "your-client-id",
                "client_secret": "your-client-secret",
                "email_domain": "example.com"
            },
        }
    }
}
```

If you are using CNDI to deploy a Data Product, and want to persist information about your Data Product to the [Polyseam Data Product Registry](https://polyseam.io/registry), just add one more block to the config:

```jsonc
{
    "nodes": [...],
    "application": {...},
    "cluster": {...},
    "dpr": {
        "organization": "daff",
        "domain": "playlists",
        "data-product": "top-running-songs"
    }
}
```

There, we have a complete `my-cndi-config.json` file. Let's see what happens when we run:

```bash
cndi init -f ./my-cndi-config.json .
```

boom



