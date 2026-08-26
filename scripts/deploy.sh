#!/usr/bin/env bash
# Forwarder to 03-measurement deploy script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

exec "${REPO_ROOT}/03-measurement/scripts/deploy.sh" "$@"
