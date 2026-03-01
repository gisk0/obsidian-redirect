variable "account_id" {
  description = "Cloudflare account ID"
  type        = string
  default     = "8a85c2c4aef344232708c5b962fdaf78"
}

variable "zone_id" {
  description = "Cloudflare zone ID for gisk0.dev"
  type        = string
  default     = "2909c763f12cb23ad4c40f40f131b747"
}

variable "publish_token" {
  description = "Secret token for the /api/publish management endpoints (X-Publish-Token header)"
  type        = string
  sensitive   = true
  # Set via TF_VAR_publish_token env var or terraform.tfvars (gitignored)
}
