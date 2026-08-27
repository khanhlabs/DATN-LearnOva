# Whole domain delegated to Route53 (domain is dedicated to this project,
# nothing else depends on it) — one hosted zone for the apex, nameservers at
# name.com point here directly.
resource "aws_route53_zone" "app" {
  name = var.root_domain
}

resource "aws_route53_record" "acm_validation" {
  for_each = {
    for dvo in aws_acm_certificate.app.domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  }

  zone_id = aws_route53_zone.app.zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.value]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "app" {
  certificate_arn         = aws_acm_certificate.app.arn
  validation_record_fqdns = [for r in aws_route53_record.acm_validation : r.fqdn]
}

# Alias record pointing to the ALB — free, no extra DNS lookup. count-gated
# alongside the ALB itself (see alb.tf); disappears when var.alb_enabled=false.
resource "aws_route53_record" "alb_alias" {
  count = var.alb_enabled ? 1 : 0

  zone_id = aws_route53_zone.app.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.app[0].dns_name
    zone_id                = aws_lb.app[0].zone_id
    evaluate_target_health = true
  }
}
