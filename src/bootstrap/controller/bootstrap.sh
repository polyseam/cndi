#!/bin/bash

sudo microk8s reset
sudo microk8s status --wait-ready

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
echo "configuring argo"

microk8s kubectl apply -f /home/ubuntu/controller/argo-cmd-params.yaml
microk8s kubectl apply -f /home/ubuntu/controller/repo-config.yaml
microk8s kubectl apply -f /home/ubuntu/controller/root-application.yaml

echo "argo configured"

echo "checking microk8s status"

sudo microk8s status --wait-ready

echo "microk8s ready"
