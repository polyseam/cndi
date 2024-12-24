# `cert_manager`

## `cndi.infrastructure.cert_manager`

The `cert_manager` block is used to configure the
[cert-manager](https://cert-manager.io/docs/) component of your cluster. The
only value which should be customized is the email address to use when
requesting certificates from [Let's Encrypt](https://letsencrypt.org/).

If you want to use Let's Encrypt to issue certificates for your cluster, and we
recommend you do, you must provide a valid email address that will be contacted
if there are any issues with your certificates that may require intervention.

Here is a minimal example of the `cert_manager` block:

```yaml
project_name: my-cluster
cndi_version: v2
provider: aws
distribution: eks
infrastructure:
  cndi:
    cert_manager:
      email: jane.smith@example.com
```

If the `cndi.cert_manager.self_signed` property is truthy or you are using
cndi's `dev` provider, we will configure the "self signed" `ClusterIssuer`
instead of the production Let's Encrypt `ClusterIssuer`.
