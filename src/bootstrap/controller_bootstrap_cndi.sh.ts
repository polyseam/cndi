// controller bootstrap script
const bootstrapShellScript = `
#!/bin/bash

# Controller Bootstrap Template

echo "bootstrapping controller"

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

echo "microk8s add-node: creating node invite with token \${bootstrap_token}"
sudo microk8s add-node --token \${bootstrap_token} -l 3600

echo "token registered"

echo "enabling microk8s addons"

echo "  dns"
sudo microk8s enable dns

echo "  ingress"
sudo microk8s enable ingress

echo "  community"
sudo microk8s enable community

echo "  nfs"
sudo microk8s enable nfs

echo "all microk8s addons enabled!"

echo "setting the default storageClass"
sudo microk8s kubectl patch storageclass nfs -p '{ "metadata": { "annotations":{ "storageclass.kubernetes.io/is-default-class": "true" } } }'


echo "installing sealed-secrets\n"
echo "creating namespace \"sealed-secrets\""
sudo microk8s kubectl create namespace sealed-secrets

echo "installing sealed-secrets-controller"

sudo microk8s kubectl --namespace sealed-secrets apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.19.1/controller.yaml 

echo "writing sealed-secrets keypair to disk"

echo "\${sealed_secrets_public_key}" > public.crt
echo "\${sealed_secrets_private_key}" > private.key

echo "TODO: remove logging of secrets"

echo "sealed-secrets public key:"
cat public.crt
echo "---\n"

echo "sealed-secrets private key:"
cat private.key
echo "---\n"

echo "applying sealed-secrets custom key"

kubectl -n "sealed-secrets" create secret tls "cndi-sealed-secrets-key" --cert="./public.crt" --key="./private.key"
kubectl -n "sealed-secrets" label secret "cndi-sealed-secrets-key" sealedsecrets.bitnami.com/sealed-secrets-key=active

echo "\nsealed-secrets key "cndi-sealed-secrets-key" created\n"

echo "deleting sealed-secrets pod so it can pick up the new key"
sudo microk8s kubectl --namespace sealed-secrets delete pod -l name=sealed-secrets-controller

echo "removing key files from disk"
rm public.crt
rm private.key

echo "creating argocd namespace"
sudo microk8s kubectl create namespace argocd

echo "installing argocd with manifest"
sudo microk8s kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "applying argocd repo config manifest"
sudo microk8s kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: private-repo
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: repository
stringData:
  type: git
  url: \${git_repo}
  password: \${git_password}
  username: \${git_username}
EOF

echo "apply argocd root app"
sudo microk8s kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root-application
  namespace: argocd
  finalizers:
  - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  destination:
    namespace: argocd
    server: https://kubernetes.default.svc
  source:
    path: cndi/cluster
    repoURL: \${git_repo}
    targetRevision: HEAD
    directory:
      recurse: true
  syncPolicy:
    automated:
      prune: true
      selfHeal: false
    syncOptions:
    - CreateNamespace=false
EOF

echo "argo configured"

echo "controller bootstrap complete"
`.trim();
export default bootstrapShellScript;
