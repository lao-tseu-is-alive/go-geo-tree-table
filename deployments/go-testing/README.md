## Kubernetes Deployment

This project is designed to be deployed on Kubernetes. The manifest files in the `/deployments/go-testing` directory provide a robust, GitOps-friendly foundation.

### Core Concepts

The application's configuration is separated into three K8s resources, which are mounted into the running container as environment variables:

1.  **`configmap-go-geo-tree-table.yaml`**: A `ConfigMap` that holds all **non-sensitive** configuration (e.g., port numbers, service names).
2.  **`app-secrets-go-geo-tree-table.yaml`**: A `Secret` that holds all **sensitive** configuration (e.g., database passwords, JWT secrets).
    * A safe, commented template is provided in `app-secrets-go-geo-tree-table.sample.yaml`.
3.  **`deployment.yml`**: The K8s `Deployment` that runs the application. It uses `configMapKeyRef` and `secretKeyRef` to inject configuration from the resources above.

### Sealed Secrets (GitOps Workflow)

This repository is configured for **Sealed Secrets** (from Bitnami). This allows you to store your application secrets in Git in an encrypted ("sealed") form, which is safe to commit. A controller in the cluster is the only thing that can decrypt them.

The `sealed-app-secrets-go-geo-tree-table.yaml` file is the encrypted, safe-to-commit version of your `app-secrets-go-geo-tree-table.yaml`.

### Deployment Workflow

Here is the one-time setup and repeatable deployment process:

#### One-Time Setup

1.  **Install Sealed Secrets:** You must have the [Sealed Secrets controller](https://github.com/bitnami-labs/sealed-secrets) installed in your cluster.
2.  **Install `kubeseal` CLI:** You need the `kubeseal` command-line tool locally to encrypt your secrets.

#### Deployment Steps

1.  **Prepare Secrets:**

    * Copy the `app-secrets-go-geo-tree-table.sample.yaml` file to a new file named `app-secrets-go-geo-tree-table.yaml` (this file is git-ignored and should **never** be committed).
    * Edit `app-secrets-go-geo-tree-table.yaml` and fill in all your production/staging values.

2.  **Encrypt (Seal) Your Secrets:**

    * Run the `kubeseal` command to encrypt your secret file. The `createAppSecrets.sh` script is a reference for this process.
    * **Note:** You must target the namespace and controller name of your cluster.

    <!-- end list -->

    ```
    # Example kubeseal command
    # Adjust namespace and controller name as needed
    kubeseal < app-secrets-go-geo-tree-table.yaml \
      --controller-name sealed-secrets \
      --controller-namespace kube-system \
      -o yaml \
      > sealed-app-secrets-go-geo-tree-table.yaml
    ```

    * This overwrites the existing `sealed-app-secrets...yaml` file with your new, encrypted secrets. You can now safely commit this file.

3.  **Apply Manifests to Cluster:**

    * Apply the configuration and deployment to your cluster.

    <!-- end list -->

    ```
    # 1. Apply the non-sensitive configuration
    kubectl apply -f deployments/go-testing/configmap-go-geo-tree-table.yaml

    # 2. Apply the encrypted secrets
    # The Sealed Secrets controller will see this and create the real Secret
    kubectl apply -f deployments/go-testing/sealed-app-secrets-go-geo-tree-table.yaml

    # 3. Apply the application deployment
    # This will pull the new image and start, using the config and secrets
    kubectl apply -f deployments/go-testing/deployment.yml
    ```