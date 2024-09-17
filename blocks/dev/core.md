## dev

When specifying the `dev` deployment target provider, you're telling `cndi` to
prepare to run your workload in development mode. This is generally assumed to
mean that the cluster will run locally, on a single virtualized node, and that
the workload will be run in a way that is conducive to rapid iteration and
experimentation.

The next section of the doc will focus on the distribution we will setup for you
locally, which can be invoked with `cndi run` after you've pushed your
repository to git.
