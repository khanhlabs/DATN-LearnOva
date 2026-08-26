output "route53_ns_delegation" {
  description = "Set these 4 values in name.com's Manage Nameservers page for the whole domain (replace whatever is currently there). Everything downstream (ACM validation, ALB alias) is then automatic."
  value       = aws_route53_zone.app.name_servers
}

output "alb_dns_name" {
  description = "Informational only — null when var.alb_enabled=false (see scripts/cloud-up.sh / cloud-down.sh)"
  value       = try(aws_lb.app[0].dns_name, null)
}

output "ec2_instance_id" {
  description = "Used by the GitHub Actions deploy workflow to target the instance via SSM"
  value       = aws_instance.app.id
}

output "github_actions_role_arn" {
  description = "Set as AWS_ROLE_ARN in the GitHub Actions workflow / repo secret"
  value       = aws_iam_role.github_actions_deploy.arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution serving private video content"
  value       = aws_cloudfront_distribution.video.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain used by the backend to create signed URLs"
  value       = aws_cloudfront_distribution.video.domain_name
}
