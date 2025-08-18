# Requirements Document

## Introduction

The bare/k3s deployment target is a new CNDI deployment option that enables
users to provision and manage lightweight Kubernetes clusters using k3s across
bare metal or virtual machines connected via Tailscale. This deployment target
integrates with the existing CNDI lifecycle (`cndi init`, `cndi run`,
`cndi destroy`) and extends the current Terraform-based infrastructure
provisioning to include k3s cluster management. The target uses Tailscale for
secure networking between nodes and automatically installs the Tailscale
operator to provide out-of-the-box DNS, TLS, and ingress capabilities.

## Requirements

### Requirement 1

**User Story:** As a DevOps engineer, I want to initialize a new CNDI project
with bare/k3s deployment target, so that I can set up the project structure and
configuration for k3s cluster management.

#### Acceptance Criteria

1. WHEN a user runs `cndi init` and selects `bare/k3s` as the deployment target
   THEN the system SHALL create appropriate project structure and configuration
   files
2. WHEN the project is initialized THEN the system SHALL generate a
   cndi_config.yaml with bare/k3s specific configuration options
3. WHEN the configuration is created THEN the system SHALL include Tailscale
   authentication and node selection parameters
4. WHEN the project structure is created THEN the system SHALL include necessary
   Terraform modules for k3s and Tailscale integration

### Requirement 2

**User Story:** As a platform administrator, I want `cndi run` to integrate k3s
provisioning with the existing Terraform workflow, so that infrastructure and
cluster management are unified in a single deployment process.

#### Acceptance Criteria

1. WHEN `cndi run` is executed with bare/k3s target THEN the system SHALL
   generate Terraform configurations for k3s cluster provisioning
2. WHEN Terraform plans are created THEN the system SHALL include resources for
   Tailscale node discovery and k3s installation
3. WHEN Terraform applies the configuration THEN the system SHALL provision k3s
   across discovered Tailscale nodes
4. WHEN the Terraform state is managed THEN the system SHALL track both
   infrastructure and cluster state consistently

### Requirement 3

**User Story:** As a platform administrator, I want CNDI to automatically
discover and provision k3s across my Tailscale-connected nodes, so that I don't
have to manually configure each node individually.

#### Acceptance Criteria

1. WHEN Terraform executes the k3s provisioning THEN the system SHALL invoke
   Tailscale APIs to discover tagged nodes
2. WHEN nodes are discovered THEN the system SHALL automatically designate one
   node as the control plane and others as worker nodes
3. WHEN provisioning k3s THEN the system SHALL use Tailscale IP addresses for
   inter-node communication
4. WHEN the cluster is formed THEN the system SHALL verify that all nodes can
   communicate securely through Tailscale

### Requirement 4

**User Story:** As a developer, I want the Tailscale operator automatically
installed in my k3s cluster through the CNDI deployment process, so that I have
immediate access to DNS, TLS, and ingress capabilities without additional
configuration.

#### Acceptance Criteria

1. WHEN the k3s cluster is successfully provisioned THEN the Terraform
   configuration SHALL include Tailscale operator installation
2. WHEN the Tailscale operator is installed THEN the system SHALL configure it
   with appropriate permissions and network policies
3. WHEN applications are deployed THEN the system SHALL provide automatic DNS
   resolution through Tailscale
4. WHEN ingress resources are created THEN the system SHALL automatically
   provision TLS certificates through the Tailscale operator

### Requirement 5

**User Story:** As a system administrator, I want to configure node selection
criteria through CNDI config, so that I can control which machines participate
in my k3s cluster.

#### Acceptance Criteria

1. WHEN configuring the cndi_config.yaml THEN the user SHALL be able to specify
   Tailscale node tags for cluster membership

### Requirement 6

**User Story:** As a DevOps engineer, I want the deployment process to leverage
Terraform's idempotent nature, so that I can safely retry deployments and manage
cluster lifecycle through standard CNDI commands.

#### Acceptance Criteria

1. WHEN `cndi run` is executed multiple times THEN Terraform SHALL only apply
   necessary changes to reach desired state
2. WHEN cluster state drifts THEN subsequent `cndi run` executions SHALL restore
   the desired configuration
3. WHEN `cndi destroy` is executed THEN the system SHALL cleanly remove all k3s
   cluster resources and Terraform state
4. WHEN cluster updates are needed THEN the system SHALL support rolling updates
   through Terraform configuration changes

### Requirement 7

**User Story:** As a security-conscious administrator, I want all cluster
communication to be encrypted and authenticated through Tailscale, so that my
cluster traffic is secure even on untrusted networks.

#### Acceptance Criteria

1. WHEN nodes communicate THEN all traffic SHALL use Tailscale's encrypted
   tunnels
2. WHEN the cluster is formed THEN the system SHALL disable any insecure
   communication channels
3. WHEN new nodes join THEN they SHALL be authenticated through Tailscale before
   cluster access is granted
4. WHEN the Tailscale operator is configured THEN it SHALL use the same security
   context as the cluster nodes

### Requirement 8

**User Story:** As a developer, I want comprehensive logging and monitoring of
the deployment process integrated with CNDI's existing output, so that I can
troubleshoot issues and understand the cluster state.

#### Acceptance Criteria

1. WHEN `cndi run` executes THEN the system SHALL provide detailed logs of both
   Terraform operations and k3s cluster provisioning
2. WHEN errors occur THEN the system SHALL provide detailed error messages with
   suggested remediation steps
3. WHEN the cluster is operational THEN the system SHALL output cluster
   connection information and kubeconfig details
4. WHEN deployment completes THEN the system SHALL provide next steps for
   accessing and using the cluster

### Requirement 9

**User Story:** As a CNDI user, I want the bare/k3s deployment target to
integrate seamlessly with existing CNDI features like GitOps and application
deployment, so that I can use the same workflow across different deployment
targets.

#### Acceptance Criteria

1. WHEN the k3s cluster is provisioned THEN the system SHALL support standard
   CNDI application deployment workflows
2. WHEN GitOps is configured THEN the system SHALL install and configure ArgoCD
   or similar GitOps operators
3. WHEN applications are defined in cndi_config.yaml THEN the system SHALL
   deploy them to the k3s cluster
4. WHEN cluster networking is configured THEN the system SHALL support the same
   ingress and service patterns as other CNDI targets
