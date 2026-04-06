# Infrastructure & CI/CD Guide — NutriTrack Private ECS

This document covers two complementary automation approaches:
- **Part A — Terraform**: Provision AWS infrastructure as code (VPC, ECS, ALB, Auto Scaling, etc.)
- **Part B — GitHub Actions**: Automate container builds and ECS deployments on every `git push`

> **Prerequisite:** Complete the [AWS Console deployment guide](../content/workshop/4.8-Verify-Setup/) first to understand every resource being created. These tools automate that same setup.

---

## Part A — Terraform Infrastructure as Code

Terraform lets you define the entire infrastructure in code, version-control it, and reproduce it consistently.

### Project Structure

```
infra/private-ecs/
├── provider.tf      # AWS provider + backend config
├── variables.tf     # Input variables
├── vpc.tf           # VPC, subnets, IGW, route tables, VPC Endpoints
├── security.tf      # Security groups
├── iam.tf           # Task execution role + task role
├── ecs.tf           # Cluster, task definition, service
├── alb.tf           # ALB, target group, listener
├── autoscaling.tf   # Auto scaling target + policies + CloudWatch alarms
└── data.tf          # Data sources (AZs, ECR, Secrets Manager)
```

### Key Files

#### `provider.tf`

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
```

#### `variables.tf`

```hcl
variable "aws_region"        { default = "ap-southeast-2" }
variable "vpc_name"          { default = "nutritrack-api-vpc" }
variable "vpc_cidr"          { default = "10.0.0.0/16" }
variable "ecs_cluster_name"  { default = "nutritrack-api-cluster" }
variable "ecs_service_name"  { default = "spot-arm-nutritrack-api-task-service" }
variable "task_family"       { default = "arm-nutritrack-api-task" }
variable "container_name"    { default = "arm-nutritrack-api-container" }
variable "container_port"    { default = 8000 }
```

#### `vpc.tf` — No NAT Gateway

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name            = var.vpc_name
  cidr            = var.vpc_cidr
  azs             = ["ap-southeast-2a", "ap-southeast-2c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.11.0/24", "10.0.12.0/24"]

  private_subnet_names = ["nutritrack-api-private-subnet-ecs01", "nutritrack-api-private-subnet-ecs02"]
  public_subnet_names  = ["nutritrack-api-public-subnet-alb01",  "nutritrack-api-public-subnet-alb02"]

  # No NAT Gateway — 100% private via VPC Endpoints
  enable_nat_gateway   = false
  enable_dns_hostnames = true
  enable_dns_support   = true
}

# S3 Gateway Endpoint (free)
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = module.vpc.private_route_table_ids
  tags = { Name = "nutritrack-api-vpc-s3-ep" }
}

# Interface Endpoints (Bedrock, ECR API, ECR DKR, Secrets Manager, CloudWatch Logs)
resource "aws_vpc_endpoint" "bedrock" {
  vpc_id              = module.vpc.vpc_id
  service_name        = "com.amazonaws.${var.aws_region}.bedrock-runtime"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = module.vpc.private_subnets
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  tags = { Name = "nutritrack-api-vpc-bedrock-ep" }
}
# (repeat for ecr.api, ecr.dkr, secretsmanager, logs)
```

#### `autoscaling.tf` — Scale-out 120s / Scale-in 300s

```hcl
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 10
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.api.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu_scale_out" {
  name               = "nutritrack-api-cluster-cpu-above-70"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "PercentChangeInCapacity"
    cooldown                = 120    # 2 min — matches evaluation window
    metric_aggregation_type = "Average"
    step_adjustment {
      metric_interval_lower_bound = 0
      scaling_adjustment          = 10
    }
  }
}

resource "aws_appautoscaling_policy" "cpu_scale_in" {
  name               = "nutritrack-api-cluster-cpu-below-20"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "PercentChangeInCapacity"
    cooldown                = 300    # 5 min — conservative scale-in
    metric_aggregation_type = "Average"
    step_adjustment {
      metric_interval_upper_bound = 0
      scaling_adjustment          = -10
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "nutritrack-api-cluster-cpu-above-70-alarm"
  alarm_description   = "Scale out when CPU exceeds 70% for 2 minutes"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 70
  treat_missing_data  = "notBreaching"
  dimensions = {
    ClusterName = aws_ecs_cluster.api.name
    ServiceName = aws_ecs_service.api.name
  }
  alarm_actions = [aws_appautoscaling_policy.cpu_scale_out.arn]
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "nutritrack-api-cluster-cpu-below-20-alarm"
  alarm_description   = "Scale in when CPU drops below 20% for 5 minutes"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = 5
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 20
  treat_missing_data  = "notBreaching"
  dimensions = {
    ClusterName = aws_ecs_cluster.api.name
    ServiceName = aws_ecs_service.api.name
  }
  alarm_actions = [aws_appautoscaling_policy.cpu_scale_in.arn]
}
```

### Deploy Commands

```bash
cd infra/private-ecs

# Initialize providers
terraform init

# Preview what will be created
terraform plan

# Apply (takes ~5 minutes)
terraform apply -auto-approve

# Get ALB DNS after deploy
terraform output alb_dns_name
```

### Destroy (Cleanup)

```bash
terraform destroy -auto-approve
```

### Auto Scaling Summary

| Alarm                | Trigger             | Action     | Cooldown |
| -------------------- | ------------------- | ---------- | -------- |
| `cpu-above-70-alarm` | CPU ≥ 70% for 2 min | +10% tasks | 120s     |
| `cpu-below-20-alarm` | CPU ≤ 20% for 5 min | -10% tasks | 300s     |

---

## Part B — GitHub Actions CI/CD

Automate container builds and ECS deployments on every push to `main`.

> **Prerequisite:** The AWS infrastructure (VPC, ECS cluster, ALB, etc.) must already exist — use Part A (Terraform) or the AWS Console guide to set it up first.

### Step 1: GitHub Repository Secrets

Go to repo → **Settings** → **Secrets and variables** → **Actions**, then add:

| Secret Name                 | Value                               |
| --------------------------- | ----------------------------------- |
| `AWS_ACCESS_KEY_ID`         | IAM user access key                 |
| `AWS_SECRET_ACCESS_KEY`     | IAM user secret key                 |
| `NUTRITRACK_API_KEY`        | Your NutriTrack API key (for tests) |
| `USDA_API_KEY`              | USDA FoodData Central API key       |
| `AVOCAVO_NUTRITION_API_KEY` | Avocavo Nutrition API key           |

### Step 2: IAM Permissions for `github-actions-deployer`

Create an IAM user with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRPermissions",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:DescribeImages",
        "ecr:DescribeRepositories"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ECSPermissions",
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:ListTaskDefinitions",
        "ecs:RegisterTaskDefinition"
      ],
      "Resource": "*"
    },
    {
      "Sid": "AutoScalingPermissions",
      "Effect": "Allow",
      "Action": [
        "application-autoscaling:RegisterScalableTarget",
        "application-autoscaling:DescribeScalableTargets",
        "application-autoscaling:DescribeScalingPolicies"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SupportPermissions",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:DescribeAlarms",
        "cloudwatch:PutMetricAlarm",
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket",
        "elbv2:DescribeLoadBalancers",
        "elbv2:DescribeTargetGroups",
        "elbv2:DescribeTargetHealth",
        "secretsmanager:DescribeSecret",
        "ec2:DescribeVpcEndpoints",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
```

### Step 3: Workflow File

Create `.github/workflows/deploy-private-ecs.yaml`:

```yaml
name: 🚀 Deploy NutriTrack API → Private ECS (ECR + Spot)

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      skip_tests:
        description: "⚠️ Skip pytest even if tests fail"
        required: false
        default: "false"
        type: choice
        options: ["false", "true"]

env:
  AWS_REGION:      ap-southeast-2
  ECR_REGISTRY:    966000660990.dkr.ecr.ap-southeast-2.amazonaws.com
  ECR_REPOSITORY:  backend/nutritrack-api-image
  ECS_CLUSTER:     nutritrack-api-cluster
  ECS_SERVICE:     spot-arm-nutritrack-api-task-service
  TASK_DEFINITION: arm-nutritrack-api-task
  CONTAINER_NAME:  arm-nutritrack-api-container
  S3_BUCKET:       nutritrack-cache-01apr26
  IMAGE_TAG:       arm

jobs:
  scan:
    name: "🛡️ Scan Secrets"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  test:
    name: "🧪 Test (pytest)"
    runs-on: ubuntu-latest
    needs: scan
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.10.11", cache: pip }
      - run: pip install -r requirements-dev.txt
      - name: Run tests
        env:
          AWS_REGION:            ${{ env.AWS_REGION }}
          AWS_ACCESS_KEY_ID:     ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          NUTRITRACK_API_KEY:    ${{ secrets.NUTRITRACK_API_KEY }}
        run: pytest tests -v --tb=short || true
        continue-on-error: true

  build:
    name: "🔨 Build ARM64 → ECR"
    runs-on: ubuntu-latest
    needs: test
    outputs:
      image_url: ${{ steps.set-image-url.outputs.image_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id:     ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region:            ${{ env.AWS_REGION }}
      - uses: aws-actions/amazon-ecr-login@v2
      - uses: docker/setup-qemu-action@v3
      - uses: docker/setup-buildx-action@v3
      - name: 🏗️ Build & Push ARM64 image
        uses: docker/build-push-action@v6
        with:
          context: .
          platforms: linux/arm64
          push: true
          cache-from: type=gha
          cache-to: type=gha,mode=max
          tags: ${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:${{ env.IMAGE_TAG }}
      - id: set-image-url
        run: echo "image_url=${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:${{ env.IMAGE_TAG }}" >> "$GITHUB_OUTPUT"

  sync-cache:
    name: "🗄️ Sync Cache → S3"
    runs-on: ubuntu-latest
    needs: build
    if: always() && needs.build.result == 'success'
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id:     ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region:            ${{ env.AWS_REGION }}
      - name: Sync cache files to S3
        run: |
          for file in data/usda_cache.json data/avocavo_cache.json data/openfoodfacts_cache.json; do
            [ -f "$file" ] && aws s3 cp "$file" "s3://${{ env.S3_BUCKET }}/$(basename $file)"
          done

  deploy:
    name: "🚀 Deploy → ECS Fargate Spot"
    runs-on: ubuntu-latest
    needs: [build, sync-cache]
    if: always() && needs.build.result == 'success'
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id:     ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region:            ${{ env.AWS_REGION }}
      - name: Force new deployment
        run: |
          aws ecs update-service \
            --cluster ${{ env.ECS_CLUSTER }} \
            --service ${{ env.ECS_SERVICE }} \
            --task-definition ${{ env.TASK_DEFINITION }} \
            --desired-count 2 \
            --force-new-deployment \
            --capacity-provider-strategy capacityProvider=FARGATE_SPOT,weight=1
      - name: Wait for stability
        run: |
          aws ecs wait services-stable \
            --cluster ${{ env.ECS_CLUSTER }} \
            --services ${{ env.ECS_SERVICE }}
      - name: Update Auto Scaling limits
        run: |
          aws application-autoscaling register-scalable-target \
            --service-namespace ecs \
            --scalable-dimension ecs:service:DesiredCount \
            --resource-id "service/${{ env.ECS_CLUSTER }}/${{ env.ECS_SERVICE }}" \
            --min-capacity 1 \
            --max-capacity 10
```

### Pipeline Flow

```
git push main
     │
     ├─► JOB 1: Gitleaks secret scan    (blocks if secrets found)
     ├─► JOB 2: pytest                  (soft fail — continues on error)
     ├─► JOB 3: Build ARM64 → ECR       (QEMU cross-compile)
     ├─► JOB 4: Upload cache JSONs → S3
     └─► JOB 5: Force ECS deployment → wait stable → update Auto Scaling
```

**Total pipeline time:** ~10-15 minutes
