terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.17"
    }
  }
  # State stored locally in terraform/ directory (repo is private)
  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "cloudflare" {
  # Reads CLOUDFLARE_API_TOKEN env var automatically
}

# ─── KV Namespace ─────────────────────────────────────────────────────────────

resource "cloudflare_workers_kv_namespace" "published_notes" {
  account_id = var.account_id
  title      = "PUBLISHED_NOTES"
}

# ─── Worker Script ────────────────────────────────────────────────────────────
# The worker bundle is built by `bun run build` (wrangler --dry-run) before apply.

resource "cloudflare_workers_script" "obsidian_redirect" {
  account_id         = var.account_id
  script_name        = "obsidian-redirect"
  content_file       = "${path.module}/../dist/index.js"
  content_sha256     = filesha256("${path.module}/../dist/index.js")
  main_module        = "index.js"
  compatibility_date = "2024-01-01"

  bindings = [
    {
      name         = "PUBLISHED_NOTES"
      type         = "kv_namespace"
      namespace_id = cloudflare_workers_kv_namespace.published_notes.id
    },
    {
      name = "PUBLISH_TOKEN"
      type = "secret_text"
      text = var.publish_token
    }
  ]
}

# ─── Route ────────────────────────────────────────────────────────────────────

resource "cloudflare_workers_route" "obs_gisk0_dev" {
  zone_id = var.zone_id
  pattern = "obs.gisk0.dev/*"
  script  = cloudflare_workers_script.obsidian_redirect.script_name
}
