export type KubernetesStorageClass = {
  allow_volume_expansion: true;
  metadata: {
    name: string;
    annotations?: Record<string, string>;
  };
  parameters: Record<string, string>;
  mount_options?: string[];
  reclaim_policy: "Delete";
  storage_provisioner: string;
  volume_binding_mode: "WaitForFirstConsumer";
  depends_on?: string[];
};
