// CloudFront video delivery stack imported from the AWS Console.
// The import blocks below make this configuration reproducible from an empty
// state; after the first apply Terraform manages the existing resources.

data "aws_s3_bucket" "video" {
  bucket = "datn-video-bucket"
}

resource "aws_cloudfront_public_key" "video_signing" {
  name    = "datn_public_key"
  comment = "nah"

  encoded_key = <<-PEM
    -----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnUatnGH91Q1V2RgW2O2x
    0Qmmp+mgleWyvlb+/1wTYdilF9irneCszjr10r8+Hp4e76QJW7pk6pjN9WIsZDoH
    2/iPpiCrDbm5Z7SqUJcoX1OukPgmeJR4ay5kRnwRUc1vhxsWJs9UumAdWCel//up
    cXieuJP6TwjQ/N2G3cqw8EO4mMYp5XZIUYHG6lR4eXTLp/1SZjVekdrHOXoz5mfG
    YuPAuk324wsEyGaDzIhrck7QWF1snrQK/Tq+9Yf4KYpeffgOumwwqjxf2/bFejB7
    yFZZUO55mNZm79tutYEmOoguB3NcnovnBz3qTDSpUmlhqU7Y/oOk33AQdVMwAN6d
    gwIDAQAB
    -----END PUBLIC KEY-----
  PEM
}

resource "aws_cloudfront_key_group" "video_signing" {
  name    = "datn_key_group"
  comment = "nah"
  items   = [aws_cloudfront_public_key.video_signing.id]
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
    trusted_key_groups     = [aws_cloudfront_key_group.video_signing.id]
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

import {
  to = aws_cloudfront_public_key.video_signing
  id = "K296WVT8GUK8LY"
}

import {
  to = aws_cloudfront_key_group.video_signing
  id = "b5b0face-c36e-4069-99e8-e5d6f111723c"
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

import {
  to = aws_s3_bucket_policy.video_cloudfront_read
  id = "datn-video-bucket"
}
