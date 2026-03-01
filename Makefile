.PHONY: build tf-init tf-plan tf-apply tf-destroy deploy

# Bundle the worker (required before tf-plan / tf-apply)
build:
	./scripts/build.sh

# Init Terraform providers
tf-init:
	cd terraform && tofu init

# Plan infra changes (builds first)
tf-plan: build
	cd terraform && \
	  TF_VAR_publish_token="$$(pass obsidian-redirect/publish-token)" \
	  CLOUDFLARE_API_TOKEN="$$(pass cloudflare/workers-api-token)" \
	  tofu plan

# Apply infra changes (builds first)
tf-apply: build
	cd terraform && \
	  TF_VAR_publish_token="$$(pass obsidian-redirect/publish-token)" \
	  CLOUDFLARE_API_TOKEN="$$(pass cloudflare/workers-api-token)" \
	  tofu apply

# Full deploy: build → apply
deploy: tf-apply

# Destroy all infra (use with care)
tf-destroy:
	cd terraform && \
	  TF_VAR_publish_token="$$(pass obsidian-redirect/publish-token)" \
	  CLOUDFLARE_API_TOKEN="$$(pass cloudflare/workers-api-token)" \
	  tofu destroy
