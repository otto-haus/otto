#!/usr/bin/env bash
set -euo pipefail

status=0

is_allowed_env_example() {
  case "$1" in
    *.env.example|*.env.sample|*.env.template|*.env.defaults)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_sensitive_path() {
  local path="$1"
  local name="${path##*/}"

  if is_allowed_env_example "$name"; then
    return 1
  fi

  case "$name" in
    .env|.env.*|*.pem|*.key|*.p12|*.pfx|*.jks|id_rsa|id_dsa|id_ecdsa|id_ed25519)
      return 0
      ;;
  esac

  case "$path" in
    secrets/*|*/secrets/*)
      return 0
      ;;
  esac

  return 1
}

while IFS= read -r path; do
  if is_sensitive_path "$path"; then
    printf 'sensitive tracked path: %s\n' "$path"
    status=1
  fi
done < <(git ls-files)

if [[ "$status" -ne 0 ]]; then
  printf 'Refusing tracked sensitive file paths. Rename to a template/example file or keep the file untracked.\n'
  exit "$status"
fi

printf 'No sensitive tracked file paths found.\n'
