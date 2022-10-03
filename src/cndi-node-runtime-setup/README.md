# node-runtime-setup

After nodes are provisioned they must be joined to a microk8s cluster, and
receive final configuration. This is accomplished by ssh-ing into each VM,
copying the `bootstrap` files for the `"worker"` role or `"controller role"`,
then executing the `bootstrap.sh` file for that node role.

This ssh step should be done within the CNDI Deno binary, however there is not
yet full compatibility with the node crypto ecosystem in Deno.

In order to keep things moving, we will write the code to do this ssh stuff in
NodeJS. We do not intend to ship with any Node dependencies, but the logic will
be nearly identical when support lands in Deno and we will migrate this module
at that point.
