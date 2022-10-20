// worker bootstrap script
const bootstrapShellScript = `
#!/bin/bash

# Worker Bootstrap Template

echo "bootstrapping worker"

echo "Installing nfs-common"
sudo apt-get install nfs-common -y

echo "Installing microk8s"
sudo snap install microk8s --classic --channel=1.25/stable

echo "Adding user to group"
sudo usermod -a -G microk8s ubuntu

echo "granting access to ~/.kube"
sudo chown -f -R ubuntu ~/.kube

echo "awaiting microk8s to be ready"
sudo microk8s status --wait-ready

echo "microk8s is ready"

echo "microk8s join: accepting node invite with token \${bootstrap_token}"

while ! sudo microk8s join \${controller_node_ip}:25000/\${bootstrap_token} --worker
do
    echo 'failed to join, retrying in 30 seconds'
    sleep 30
done

echo 'cluster joined'

echo 'worker bootstrap complete'
`.trim()

export default bootstrapShellScript