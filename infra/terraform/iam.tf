# --- EC2 instance role: lets SSM Agent register the instance as a managed node ---
resource "aws_iam_role" "ec2_ssm" {
  name = "learnova-ec2-ssm-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_ssm_core" {
  role       = aws_iam_role.ec2_ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# One-off secret handoff: lets the instance pull the deploy .env files from
# Parameter Store (SecureString — value never appears in CloudTrail/RunCommand
# history, unlike embedding it directly in an SSM command). Scoped to just the
# /learnova/deploy/* path; those parameters get deleted right after use.
data "aws_kms_alias" "ssm" {
  name = "alias/aws/ssm"
}

data "aws_caller_identity" "current" {}

# MediaConvert uses this role to read source media and write transcoded output
# in the private video bucket. It was originally created in the AWS Console.
resource "aws_iam_role" "mediaconvert" {
  name                 = "MediaConvertRole"
  description          = "Allows MediaConvert service to call S3 APIs and API Gateway on your behalf."
  max_session_duration = 3600

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "mediaconvert.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "mediaconvert_video_bucket" {
  name = "MediaConvertS3AccessPolicy"
  role = aws_iam_role.mediaconvert.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
      ]
      Resource = "arn:aws:s3:::datn-video-bucket/*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "mediaconvert_api_gateway_invoke" {
  role       = aws_iam_role.mediaconvert.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonAPIGatewayInvokeFullAccess"
}

resource "aws_iam_role_policy_attachment" "mediaconvert_s3_full_access" {
  role       = aws_iam_role.mediaconvert.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

import {
  to = aws_iam_role.mediaconvert
  id = "MediaConvertRole"
}

import {
  to = aws_iam_role_policy.mediaconvert_video_bucket
  id = "MediaConvertRole:MediaConvertS3AccessPolicy"
}

import {
  to = aws_iam_role_policy_attachment.mediaconvert_api_gateway_invoke
  id = "MediaConvertRole/arn:aws:iam::aws:policy/AmazonAPIGatewayInvokeFullAccess"
}

import {
  to = aws_iam_role_policy_attachment.mediaconvert_s3_full_access
  id = "MediaConvertRole/arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_role_policy" "ec2_read_deploy_params" {
  name = "learnova-ec2-read-deploy-params"
  role = aws_iam_role.ec2_ssm.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "ssm:GetParameter"
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/learnova/deploy/*"
      },
      {
        Effect   = "Allow"
        Action   = "kms:Decrypt"
        Resource = data.aws_kms_alias.ssm.target_key_arn
      }
    ]
  })
}

# Lets the application running on EC2 manage the private media objects used by
# uploads, HLS output, avatars, and certificates.
resource "aws_iam_role_policy" "ec2_video_bucket_access" {
  name = "LearnOvaVideoBucketAccess"
  role = aws_iam_role.ec2_ssm.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "BucketAccess"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = "arn:aws:s3:::datn-video-bucket"
      },
      {
        Sid    = "ObjectAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
        ]
        Resource = "arn:aws:s3:::datn-video-bucket/*"
      },
    ]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "learnova-ec2-instance-profile"
  role = aws_iam_role.ec2_ssm.name
}

# --- GitHub Actions OIDC: lets the deploy workflow assume a role without a stored access key ---
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_actions_deploy" {
  name = "learnova-github-actions-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/main"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "github_actions_deploy" {
  name = "learnova-github-actions-deploy-policy"
  role = aws_iam_role.github_actions_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:StartInstances",
          "ec2:DescribeInstances",
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ec2:ResourceTag/Name" = "learnova-app"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceStatus",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:SendCommand",
          "ssm:GetCommandInvocation",
        ]
        Resource = "*"
      }
    ]
  })
}
