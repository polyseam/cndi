// controller bootstrap script
const bootstrapShellScript = `
#!/bin/bash

# Controller Bootstrap Template

# build-time packer:
# sudo apt-get install nfs-common -y
# sudo snap install microk8s --classic --channel=1.26/stable

# run-time cloud-init: 

echo "bootstrapping controller"

echo "Adding user to group"
sudo usermod -a -G microk8s ubuntu

echo "granting access to ~/.kube"
sudo chown -f -R ubuntu ~/.kube

# in order to get a fresh install we need to leave the og packer cluster
echo "running microk8s leave"
sudo microk8s leave
echo "packer microk8s cluster was left"

echo "awaiting microk8s to be ready"

sudo microk8s status --wait-ready

echo "microk8s is ready"

echo "microk8s join: accepting node invite"

while ! sudo microk8s join \${leader_node_ip}:25000/\${bootstrap_token}
do
    echo 'failed to join, retrying in 30 seconds'
    sleep 30
done

echo 'cluster joined'

echo 'controller bootstrap complete'
`.trim();

export default bootstrapShellScript;
