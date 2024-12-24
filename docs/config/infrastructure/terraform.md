# `terraform`

## `infrastructure.terraform`

If you'd like to go beyond basic infrastructure parameters, this section will
discuss an element of `infrastructure` config which can grant you complete
control over your cluster and it's infrastructure.

Your `infrastructure` block can optionally include a `terraform` section. This
is an object which corresponds to the shape of the `cndi/terraform/cdk.tf.json`
file we generate on your behalf. This means you can add keys which we will
_merge_ into that generated terraform artifact. We call this feature _terraform
passthru_ and it is probably best thought of as an escape hatch.

For a quick example, lets consider how we might add an
[S3 bucket](https://aws.amazon.com/s3) to our `cndi_config`:

```yaml
project_name: my-postgres-project
cndi_version: v2
provider: aws
distribution: eks
infrastructure:
  terraform:
    resource:
      aws_s3_bucket:
        my_pg_bucket:
          bucket: pg-backups-bucket
  cndi:
    nodes:
      - name: postgres-nodes
        count: 3
        instance_type: t3.medium
```

Remember that _terraform passthru_ is used when there is no existing
`infrastructure.cndi` component, `application` or `cluster_manifest` available
to accomplish your goal.
