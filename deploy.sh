#!/usr/bin/env bash
# Convenience wrapper — run from /opt/order-notebook:
#   ./deploy.sh
exec "$(cd "$(dirname "$0")" && pwd)/deploy/deploy.sh" "$@"
