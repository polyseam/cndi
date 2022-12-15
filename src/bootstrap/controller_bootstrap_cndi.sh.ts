// controller bootstrap script
const bootstrapShellScript = `
#!/bin/bash

# Controller Bootstrap Template

echo "bootstrapping controller"

echo "Installing nfs-common"
sudo apt-get install nfs-common -y

echo "Installing microk8s"
sudo snap install microk8s --classic --channel=1.26/stable

echo "Adding user to group"
sudo usermod -a -G microk8s $USER

echo "granting access to ~/.kube"
sudo chown -f -R $USER ~/.kube

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
