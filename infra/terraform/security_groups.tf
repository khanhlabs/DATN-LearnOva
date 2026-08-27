# ALB SG — the only thing actually exposed to the internet.
resource "aws_security_group" "alb" {
  name        = "learnova-alb-sg"
  description = "Public entrypoint: ALB listens 80/443"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "learnova-alb-sg" }
}

import {
  to = aws_security_group.alb
  id = "sg-08339b8f13d5d12b3"
}

# EC2 SG — only reachable from the ALB, plus optional SSH from a fixed CIDR.
resource "aws_security_group" "ec2" {
  name        = "learnova-ec2-sg"
  description = "App instance: only accepts traffic from the ALB"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "HTTP from ALB only"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  dynamic "ingress" {
    for_each = length(var.ssh_allowed_cidr) > 0 ? [1] : []
    content {
      description = "SSH (optional, fallback to SSM if unset)"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = var.ssh_allowed_cidr
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "learnova-ec2-sg" }
}

import {
  to = aws_security_group.ec2
  id = "sg-0698c81eef7474b55"
}
