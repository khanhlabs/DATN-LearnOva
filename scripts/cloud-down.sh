#!/bin/bash
# Manual "done for now" switch — tears down the ALB (var.alb_enabled=false,
# stops billing immediately) and stops EC2 right away instead of waiting for
# the nightly cron. Run by hand, no automation.
set -euo pipefail

REGION="ap-southeast-1"
INSTANCE_ID="i-074bf4c6e39e3dfeb"
case "${BASH_SOURCE[0]}" in
  */*) SCRIPT_DIR="${BASH_SOURCE[0]%/*}" ;;
  *)   SCRIPT_DIR="." ;;
esac
SCRIPT_DIR="$(cd -- "$SCRIPT_DIR" && pwd)"
TF_DIR="$SCRIPT_DIR/../infra/terraform"

echo "==> Tearing down ALB..."
(cd "$TF_DIR" && terraform apply -auto-approve -var="alb_enabled=false")

STATE=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --region "$REGION" \
  --query "Reservations[0].Instances[0].State.Name" --output text)
if [ "$STATE" = "running" ]; then
  echo "==> Stopping EC2 ($INSTANCE_ID)..."
  aws ec2 stop-instances --instance-ids "$INSTANCE_ID" --region "$REGION" >/dev/null
else
  echo "==> EC2 already $STATE."
fi

echo "==> Done. ALB removed, EC2 stopping. Data/containers untouched — cloud-up.sh brings both back."
