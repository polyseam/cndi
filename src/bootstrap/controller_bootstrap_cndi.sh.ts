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

echo "  cert-manager"
sudo microk8s enable cert-manager

echo "all microk8s addons enabled!"

echo "setting the default storageClass"
sudo microk8s kubectl patch storageclass nfs -p '{ "metadata": { "annotations":{ "storageclass.kubernetes.io/is-default-class": "true" } } }'


echo "installing sealed-secrets\n"

echo "installing sealed-secrets-controller"

sudo microk8s kubectl --namespace kube-system apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.19.1/controller.yaml 

echo "writing sealed-secrets keypair to disk"

echo "\${sealed_secrets_public_key}" > public.crt
echo "\${sealed_secrets_private_key}" > private.key

echo "applying sealed-secrets custom key"

sudo microk8s kubectl -n "kube-system" create secret tls "cndi-sealed-secrets-key" --cert="./public.crt" --key="./private.key"
sudo microk8s kubectl -n "kube-system" label secret "cndi-sealed-secrets-key" sealedsecrets.bitnami.com/sealed-secrets-key=active

echo "\nsealed-secrets key "cndi-sealed-secrets-key" created\n"

echo "deleting sealed-secrets pod so it can pick up the new key"
sudo microk8s kubectl --namespace kube-system delete pod -l name=sealed-secrets-controller

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

echo "applying argocd ConfigMap manifest"
sudo microk8s kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
  labels:
    app.kubernetes.io/name: argocd-cm
    app.kubernetes.io/part-of: argocd
data:
  admin.enabled: "true"
  accounts.readonlyuser: login, apiKey
  timeout.reconciliation: 70s # default is 180s
EOF

echo "creating argocd readonlyuser account"

NOW="'$(date +%FT%T%Z)'"

echo "readonlyuser password: \${readonlyuser_password}"

sudo microk8s kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
type: Opaque
metadata:
  name: readonlyuser-account
  namespace: argocd
  labels:
    app.kubernetes.io/name: argocd-secret
    app.kubernetes.io/part-of: argocd
stringData:
  accounts.readonlyuser.password: \${argoui_readonly_password}
  accounts.readonlyuser.passwordMtime: $NOW
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
