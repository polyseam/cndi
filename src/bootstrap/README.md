The contents of the `controller` directory will be copied to each vm with the role `"controller"` in your microk8s cluster

The contents of the `worker` directory will be copied to each vm with the role `"worker"` in your microk8s cluster

When all the files are copied to a node, we run `/${role}/bootstrap.sh` on the node, and it does the final runtime setup