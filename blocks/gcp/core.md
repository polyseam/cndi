## gcp

This cluster will be deployed on
[Google Cloud Platform](https://cloud.google.com/gcp). When your cluster is
initialized the next step is to go to your domain registrar and create an `A`
record for [ArgoCD](https://argo-cd.readthedocs.io/en/stable/) which points to
the loadbalancer that was created for your cluster found on the
[GCP Load Balancers Page](https://console.cloud.google.com/net-services/loadbalancing)
.
