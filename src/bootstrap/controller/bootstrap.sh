#!/bin/bash

echo "Installing snapd"
sudo apt-get install snapd -y
echo "Installing nfs-common"
sudo apt-get install nfs-common -y
echo "Installing microk8s"
sudo snap install microk8s --classic --channel=1.25/stable
echo "Adding user to group"
sudo usermod -a -G microk8s ubuntu
echo "awaiting microk8s to be ready"
sudo microk8s status --wait-ready
echo "microk8s is ready"

joinToken=`cat /home/ubuntu/controller/join-token.txt`

echo "microk8s add-node: creating node invite with token $joinToken"

microk8s add-node -t $joinToken -l 600

echo "token registered"

echo "enabling microk8s addons"
echo "  dns"
sudo microk8s enable dns
echo "  hostpath-storage"
sudo microk8s enable hostpath-storage
echo "  ingress"
sudo microk8s enable ingress
echo "  community"
sudo microk8s enable community
echo "  nfs"
sudo microk8s enable nfs
echo "all microk8s addons enabled!"
echo "creating argocd namespace"
sudo microk8s kubectl create namespace argocd
echo "installing argocd with manifest"
sudo microk8s kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "sleeping for 60 seconds to allow argocd to start"
sleep 60

echo "configuring argo"

microk8s kubectl apply -f /home/ubuntu/controller/argo-cmd-params.yaml
microk8s kubectl apply -f /home/ubuntu/controller/repo-config.yaml
microk8s kubectl apply -f /home/ubuntu/controller/root-application.yaml

echo "argo configured"

echo "checking microk8s status"

sudo microk8s status --wait-ready

echo "microk8s ready"
