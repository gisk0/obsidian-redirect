# Terraform — obs.gisk0.dev Infrastructure

All Cloudflare infrastructure for `obs.gisk0.dev` is managed here as code.

## What's managed

| Resource      | Terraform name                                    | Notes                       |
| ------------- | ------------------------------------------------- | --------------------------- |
| KV Namespace  | `cloudflare_workers_kv_namespace.published_notes` | Stores published notes JSON |
| Worker Script | `cloudflare_workers_script.obsidian_redirect`     | Bundled TS worker           |
| Route         | `cloudflare_workers_route.obs_gisk0_dev`          | `obs.gisk0.dev/*` → worker  |

## Prerequisites

- `tofu` (OpenTofu) installed — `brew install opentofu` or use the install script
- `pass` configured with:
  - `pass cloudflare/workers-api-token`
  - `pass obsidian-redirect/publish-token`
- `bun` installed (for the build step)

## First-time setup

```bash
# 1. Install providers
make tf-init

# 2. Import existing resources (only needed once, for resources created before TF)
cd terraform
export CLOUDFLARE_API_TOKEN=$(pass cloudflare/workers-api-token)
export TF_VAR_publish_token=$(pass obsidian-redirect/publish-token)

# Import the KV namespace that already exists
tofu import cloudflare_workers_kv_namespace.published_notes \
  '<your-account-id>/<your-kv-namespace-id>'

# Import the worker route
# First get the route ID:
curl -s "https://api.cloudflare.com/client/v4/zones/<your-zone-id>/workers/routes" \
  -H "Authorization: Bearer $(pass cloudflare/workers-api-token)" | python3 -m json.tool
# Then:
tofu import cloudflare_workers_route.obs_gisk0_dev '<your-zone-id>/<route_id>'
```

## Workflow

```bash
# Plan changes (auto-reads secrets from pass)
make tf-plan

# Apply changes
make tf-apply

# Or just: build → apply in one shot
make deploy
```

## Secrets

Secrets are **never** hardcoded. They're read at plan/apply time:

| Secret                 | Source                                 | How used                |
| ---------------------- | -------------------------------------- | ----------------------- |
| `CLOUDFLARE_API_TOKEN` | `pass cloudflare/workers-api-token`    | Terraform provider auth |
| `PUBLISH_TOKEN`        | `pass obsidian-redirect/publish-token` | Worker secret binding   |

The `publish_token` variable is marked `sensitive = true` — it won't appear in plan output.

## State

State is stored locally in `terraform/terraform.tfstate`. Since this repo is **private**, that's fine. The state file is gitignored to avoid accidental commits of secrets.

> If you ever want remote state, migrate to Cloudflare R2 or Terraform Cloud backend.

## Variable overrides

You can also override variables directly:

```bash
cd terraform
CLOUDFLARE_API_TOKEN=<token> TF_VAR_publish_token=<secret> tofu plan
```

Or create a `terraform/terraform.tfvars` (gitignored):

```hcl
publish_token = "your-secret-here"
```
