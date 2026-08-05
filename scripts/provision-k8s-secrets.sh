#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env}"
NAMESPACE="${NAMESPACE:-ygomgr}"
SECRET_NAME="${SECRET_NAME:-ygomgr-secret}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: env file not found: $ENV_FILE"
  exit 1
fi

# Load .env values.
# Only source .env files you control.
set -a
source "$ENV_FILE"
set +a

SECRET_KEYS=(
  MARIADB_ROOT_PASSWORD
  MARIADB_PASSWORD
  SUPABASE_SERVICE_ROLE_KEY
)

OPTIONAL_SECRET_KEYS=(
  NEXT_PUBLIC_SUPABASE_URL
)

args=()

for key in "${SECRET_KEYS[@]}"; do
  value="${!key:-}"
  if [[ -z "$value" ]]; then
    echo "Error: missing required value: $key"
    exit 1
  fi
  args+=(--from-literal="$key=$value")
done

for key in "${OPTIONAL_SECRET_KEYS[@]}"; do
  value="${!key:-}"
  if [[ -n "$value" ]]; then
    args+=(--from-literal="$key=$value")
  fi
done

kubectl create namespace "$NAMESPACE" \
  --dry-run=client \
  -o yaml | kubectl apply -f -

kubectl -n "$NAMESPACE" create secret generic "$SECRET_NAME" \
  "${args[@]}" \
  --dry-run=client \
  -o yaml | kubectl apply -f -

echo "Secret '$SECRET_NAME' applied in namespace '$NAMESPACE'."
