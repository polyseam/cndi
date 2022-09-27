#!/bin/bash

joinToken=`cat /home/ubuntu/controller/join-token.txt`

echo "microk8s add-node: creating node invite with token $joinToken"

microk8s add-node -t $joinToken -l 600

echo "token registered"

echo "updating admin credentials"

microk8s kubectl config set-credentials admin --token $joinToken

echo "admin credentials updated"

echo "configuring argo"

microk8s kubectl apply -f /home/ubuntu/controller/repo-config.yaml
microk8s kubectl apply -f /home/ubuntu/controller/root-application.yaml

echo "argo configured"

echo "checking microk8s status"

microk8s status
