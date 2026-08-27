variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "instance_type" {
  description = "EC2 instance type. Bump to t3.large if OOM observed running all 5 containers + mvn build."
  type        = string
  default     = "t3.medium"
}

variable "root_volume_size_gb" {
  description = "EBS gp3 root volume size (GB)"
  type        = number
  default     = 30
}

variable "domain_name" {
  description = "Full subdomain the app will be served on (ACM cert + alias record)"
  type        = string
  default     = "datn.khanh.engineer"
}

variable "root_domain" {
  description = "Apex domain — Route53 hosted zone name, nameservers at name.com must point here"
  type        = string
  default     = "khanh.engineer"
}

variable "ssh_allowed_cidr" {
  description = "CIDR allowed to SSH into the EC2 instance (port 22). Leave empty list to disable SSH entirely (SSM only)."
  type        = list(string)
  default     = []
}

variable "github_repo" {
  description = "GitHub repo allowed to assume the deploy role via OIDC, format: org/repo"
  type        = string
  default     = "khanhlabs/DATN-LearnOva"
}

variable "key_pair_name" {
  description = "Existing EC2 key pair name for optional SSH access. Leave null to skip attaching a key pair."
  type        = string
  default     = null
}

variable "git_repo_url" {
  description = "Repo URL the instance clones into /app on first boot"
  type        = string
  default     = "https://github.com/khanh030106/DATN-LearnOva.git"
}

variable "nightly_shutdown_hour" {
  description = "UTC hour (0-23) the instance auto-shuts down every night as a safety net against forgotten running sessions"
  type        = number
  default     = 16 # 23:00 ICT (UTC+7)
}

variable "alb_enabled" {
  description = "Toggle to create/destroy the ALB + target group + listeners + DNS alias on demand, without touching ACM cert or EC2. Flip via scripts/cloud-up.sh / cloud-down.sh."
  type        = bool
  default     = true
}
