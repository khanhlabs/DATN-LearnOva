#!/bin/bash
# Manual "I want to use the cloud demo now" switch — starts EC2 if stopped
# and re-creates the ALB (var.alb_enabled=true). Run by hand, no automation.
set -euo pipefail

REGION="ap-southeast-1"
INSTANCE_ID="i-074bf4c6e39e3dfeb"
case "${BASH_SOURCE[0]}" in
  */*) SCRIPT_DIR="${BASH_SOURCE[0]%/*}" ;;
  *)   SCRIPT_DIR="." ;;
esac
SCRIPT_DIR="$(cd -- "$SCRIPT_DIR" && pwd)"
TF_DIR="$SCRIPT_DIR/../infra/terraform"

echo "==> Instance: $INSTANCE_ID"

STATE=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --region "$REGION" \
  --query "Reservations[0].Instances[0].State.Name" --output text)
if [ "$STATE" != "running" ]; then
  echo "==> Starting EC2 (currently $STATE)..."
  aws ec2 start-instances --instance-ids "$INSTANCE_ID" --region "$REGION" >/dev/null
fi
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"
aws ec2 wait instance-status-ok --instance-ids "$INSTANCE_ID" --region "$REGION"
echo "==> EC2 running."

echo "==> Bringing ALB back up..."
(cd "$TF_DIR" && terraform apply -auto-approve -var="alb_enabled=true")

echo "==> Done. https://datn.khanh.engineer should respond within ~30s."
