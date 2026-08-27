# Whole domain delegated to Route53 (domain is dedicated to this project,
# nothing else depends on it) — one hosted zone for the apex, nameservers at
# name.com point here directly.
resource "aws_route53_zone" "app" {
  name = var.root_domain
}

// This is the zone currently delegated by name.com (its nameservers resolve
// publicly). Import it rather than creating another hosted zone for the same
// domain.
import {
  to = aws_route53_zone.app
  id = "Z03692063FN2NF9R3Y84R"
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

import {
  to = aws_route53_record.acm_validation["datn.khanh.engineer"]
  id = "Z03692063FN2NF9R3Y84R__cf5b6485f8de51c425fe8ecddd579608.datn.khanh.engineer_CNAME"
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

import {
  to = aws_route53_record.alb_alias[0]
  id = "Z03692063FN2NF9R3Y84R_datn.khanh.engineer_A"
}
