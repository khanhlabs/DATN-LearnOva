// CloudFront video delivery stack imported from the AWS Console.
// The signing public key and key group remain managed in CloudFront itself;
// Terraform only references the existing key group.

locals {
  existing_video_signing_key_group_id = "b5b0face-c36e-4069-99e8-e5d6f111723c"
}

data "aws_s3_bucket" "video" {
  bucket = "datn-video-bucket"
}

resource "aws_cloudfront_origin_access_control" "video" {
  name                              = "oac-datn-video-bucket.s3.ap-southeast-1.amazonaws.co-mrakdi7psmb"
  description                       = "Created by CloudFront"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_wafv2_web_acl" "cloudfront" {
  provider = aws.us_east_1

  name  = "CreatedByCloudFront-82309d5c"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWS-AWSManagedRulesAmazonIpReputationList"
    priority = 0

    override_action {
      count {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWS-AWSManagedRulesAmazonIpReputationList"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      count {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWS-AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      count {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "CreatedByCloudFront-82309d5c"
    sampled_requests_enabled   = true
  }
}

resource "aws_cloudfront_distribution" "video" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "datn_cloudfront"
  price_class         = "PriceClass_All"
  web_acl_id          = aws_wafv2_web_acl.cloudfront.arn
  http_version        = "http2"
  wait_for_deployment = true

  # This distribution is a live delivery endpoint. Never let a configuration
  # change or a targeted destroy delete it inadvertently.
  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name = "datn_cloudfront"
  }

  origin {
    domain_name              = data.aws_s3_bucket.video.bucket_regional_domain_name
    origin_id                = "datn-video-bucket.s3.ap-southeast-1.amazonaws.com-mrakbgofwvd"
    origin_access_control_id = aws_cloudfront_origin_access_control.video.id
    connection_attempts      = 3
    connection_timeout       = 10

  }

  default_cache_behavior {
    target_origin_id       = "datn-video-bucket.s3.ap-southeast-1.amazonaws.com-mrakbgofwvd"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6" // Managed-CachingOptimized
    trusted_key_groups     = [local.existing_video_signing_key_group_id]
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

resource "aws_s3_bucket_policy" "video_cloudfront_read" {
  bucket = data.aws_s3_bucket.video.id

  policy = jsonencode({
    Version = "2008-10-17"
    Id      = "PolicyForCloudFrontPrivateContent"
    Statement = [{
      Sid       = "AllowCloudFrontServicePrincipal"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${data.aws_s3_bucket.video.arn}/*"
      Condition = {
        ArnLike = {
          "AWS:SourceArn" = aws_cloudfront_distribution.video.arn
        }
      }
    }]
  })
}

// Stop tracking the legacy Console-managed signing resources without
// destroying them. This is a state-only change when applied.
removed {
  from = aws_cloudfront_public_key.video_signing

  lifecycle {
    destroy = false
  }
}

removed {
  from = aws_cloudfront_key_group.video_signing

  lifecycle {
    destroy = false
  }
}

import {
  to = aws_cloudfront_origin_access_control.video
  id = "E2CL8OFSW4K19B"
}

import {
  to = aws_wafv2_web_acl.cloudfront
  id = "07af7f3f-4773-407e-8c81-39f08cedfd3a/CreatedByCloudFront-82309d5c/CLOUDFRONT"
}

import {
  to = aws_cloudfront_distribution.video
  id = "E73YNWZQUGSU2"
}
