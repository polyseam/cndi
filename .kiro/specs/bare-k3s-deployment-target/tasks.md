# Implementation Plan

-
  1. [ ] Extend core type system for bare/k3s support
  - Add `bare` to CNDIProvider type in src/cndi_config/types.ts
  - Add `k3s` to CNDIDistribution type in src/cndi_config/types.ts
  - Update distribution mapping to include bare -> k3s default
  - _Requirements: 1.1, 2.1_

-
  2. [ ] Create bare/k3s configuration schema and validation
  - Extend CNDIInfrastructure type to include bare_k3s configuration
  - Implement validation logic for bare/k3s specific configuration in
    src/cndi_config/validate/
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

-
  3. [ ] Implement Tailscale node discovery and selection logic
  - Create src/outputs/terraform/tailscale/ directory with API client
    implementation
  - Implement node discovery functions that query Tailscale API for tagged nodes
  - Create node filtering logic based on tags and resource requirements
  - Write unit tests for node selection algorithms
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

-
  4. [ ] Create Terraform output generation for bare/k3s
  - Create src/outputs/terraform/bare/ directory structure
  - Implement Terraform configuration generation for Tailscale provider
  - Create k3s provisioning module templates
  - Add bare/k3s case to main Terraform staging logic in
    src/outputs/terraform/stage.ts
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

-
  5. [ ] Implement k3s cluster provisioning Terraform modules
  - Create Terraform templates for k3s control plane installation
  - Implement worker node joining logic in Terraform
  - Add cluster token generation and distribution
  - Create kubeconfig generation for external access
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

-
  6. [ ] Add Tailscale operator deployment integration
  - Create cluster manifest templates for Tailscale operator in
    src/outputs/cluster_manifests
  - Implement operator configuration with DNS and TLS settings
  - Add operator deployment to core applications workflow
  - Create RBAC and network policy configurations
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

-
  7. [ ] Create bare/k3s template blocks and prompts
  - Create blocks/bare/ directory with configuration blocks
  - Implement core prompts for Tailscale authentication and node selection
  - Create node requirements and cluster configuration prompts
  - Add bare/k3s specific environment variable blocks
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

-
  8. [ ] Integrate bare/k3s with cndi create command
  - Update template system to recognize bare/k3s as valid deployment target
  - Add bare/k3s to available options in interactive mode
  - Implement project structure generation for bare/k3s projects
  - Create default cndi_config.yaml template for bare/k3s
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

-
  9. [ ] Extend cndi run command for bare/k3s deployment
  - Add bare/k3s case to deployment workflow in src/commands/run.ts
  - Implement Tailscale authentication validation
  - Add node discovery and validation steps
  - Integrate k3s provisioning with existing Terraform workflow
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

-
  10. [ ] Implement cluster health validation and monitoring
  - Create cluster readiness checks for k3s nodes
  - Implement network connectivity validation between nodes
  - Add Tailscale operator health verification
  - Create comprehensive error reporting for deployment failures
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

-
  11. [ ] Add cndi destroy support for bare/k3s clusters
  - Implement clean cluster teardown in Terraform
  - Add k3s uninstallation from nodes
  - Create Tailscale resource cleanup procedures
  - Ensure proper state file cleanup
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

-
  12. [ ] Integrate with existing CNDI GitOps workflow
  - Ensure ArgoCD deployment works with k3s clusters
  - Verify application deployment through existing CNDI workflows
  - Test ingress and service patterns with Tailscale networking
  - Validate cluster manifest deployment functionality
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

-
  13. [ ] Create comprehensive error handling and logging
  - Implement detailed error messages for common failure scenarios
  - Add troubleshooting guidance for Tailscale and k3s issues
  - Create deployment progress logging and status reporting
  - Implement recovery procedures for partial deployment failures
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

-
  14. [ ] Write integration tests for bare/k3s deployment
  - Create test suite for Tailscale node discovery
  - Implement k3s cluster provisioning tests
  - Add end-to-end deployment workflow tests
  - Create application deployment validation tests
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

-
  15. [ ] Update documentation and examples
  - Create bare/k3s deployment guide
  - Add configuration examples and best practices
  - Update CLI help text and command documentation
  - Create troubleshooting guide for common issues
  - _Requirements: 8.3, 8.4_
