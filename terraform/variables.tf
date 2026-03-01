variable "account_id" {
  description = "Cloudflare account ID"
  type        = string
  # Set via terraform.tfvars (gitignored) or TF_VAR_account_id
}

variable "zone_id" {
  description = "Cloudflare zone ID for gisk0.dev"
  type        = string
  # Set via terraform.tfvars (gitignored) or TF_VAR_zone_id
}

variable "publish_token" {
  description = "Secret token for the /api/publish management endpoints (X-Publish-Token header)"
  type        = string
  sensitive   = true
  # Set via TF_VAR_publish_token env var or terraform.tfvars (gitignored)
}
