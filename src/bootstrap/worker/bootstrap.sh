#!/bin/bash

echo "installing dependencies"

echo "Installing snapd"
sudo apt-get install snapd -y
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

echo "Joining the cluster with invite"

. /home/ubuntu/worker/accept-invite.sh