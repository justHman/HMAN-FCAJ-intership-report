## Phase 8: ECS Fargate — Private Subnet Deployment

Deploy the NutriTrack FastAPI container on **AWS ECS Fargate** inside a fully private VPC. Traffic flows:

```
Internet → IGW → ALB (Public Subnets) → Target Group → ECS Fargate (Private Subnets)
                                                              ↓
                        VPC Endpoints (Bedrock · S3 · ECR · Secrets Manager · CloudWatch)
```

**No NAT Gateway** — 100% private via VPC Endpoints to minimize cost.
**Region:** `ap-southeast-2` · **AZs:** `ap-southeast-2a` and `ap-southeast-2c`

---

## Prerequisites

Before starting, make sure you have:

- An **AWS Account** with billing enabled and credit card attached
- **AWS CLI v2** installed and configured (`aws configure`)
- **Docker** installed locally (for building and pushing images)
- **Terraform ≥ 1.5** installed (optional — for IaC path)
- A **GitHub repository** (for CI/CD path)
- The NutriTrack API source code locally (with a `Dockerfile`)

> If you haven't set up ECR yet, complete section **4.2 Prerequisites** first.

---

## Architecture Overview

![Architecture Overview](/solution-architect/cicd-nutritrack-api-vpc.drawio.png)

**5 VPC Endpoints (no NAT needed):**

| Endpoint Name                   | Service           | Type      | Purpose             |
| ------------------------------- | ----------------- | --------- | ------------------- |
| `nutritrack-api-vpc-bedrock-ep` | `bedrock-runtime` | Interface | AI model calls      |
| `nutritrack-api-vpc-api-ecr-ep` | `ecr.api`         | Interface | Pull image metadata |
| `nutritrack-api-dkr-ecr-ep`     | `ecr.dkr`         | Interface | Pull Docker layers  |
| `nutritrack-api-vpc-s3-ep`      | `s3`              | Gateway   | Cache sync (free!)  |
| `nutritrack-api-vpc-sm-ep`      | `secretsmanager`  | Interface | API key retrieval   |
| `nutritrack-api-vpc-cw-ep`      | `logs`            | Interface | CloudWatch logging  |

---

## Choose Your Path

| Path                         | Best For                               | Time        |
| ---------------------------- | -------------------------------------- | ----------- |
| **A — AWS Console**          | Learning the concepts step by step     | ~2 hours    |
| **B — Terraform (IaC)**      | Reproducible, version-controlled infra | ~30 minutes |
| **C — GitHub Actions CI/CD** | Automated deploy on every `git push`   | ~45 minutes |

---

## Path A — AWS Console (Step by Step)

### Step 1: Create VPC

1. Open **VPC Console** → **Your VPCs** → **Create VPC**
2. Select **VPC only**
3. Fill in:
   - **Name tag:** `nutritrack-api-vpc`
   - **IPv4 CIDR block:** `10.0.0.0/16`
4. Click **Create VPC**

### Step 2: Create Internet Gateway

1. VPC Console → **Internet gateways** → **Create internet gateway**
2. **Name:** `nutritrack-api-igw`
3. After creation: **Actions** → **Attach to VPC** → select `nutritrack-api-vpc` → **Attach**

### Step 3: Create Subnets (4 total)

Repeat **Create subnet** four times in the `nutritrack-api-vpc`:

| Name                                  | CIDR           | AZ                | Type    |
| ------------------------------------- | -------------- | ----------------- | ------- |
| `nutritrack-api-public-subnet-alb01`  | `10.0.11.0/24` | `ap-southeast-2a` | Public  |
| `nutritrack-api-public-subnet-alb02`  | `10.0.12.0/24` | `ap-southeast-2c` | Public  |
| `nutritrack-api-private-subnet-ecs01` | `10.0.1.0/24`  | `ap-southeast-2a` | Private |
| `nutritrack-api-private-subnet-ecs02` | `10.0.2.0/24`  | `ap-southeast-2c` | Private |

> For the **public** subnets only: after creation → select subnet → **Actions** → **Edit subnet settings** → enable **Auto-assign public IPv4 address** → **Save**.
>
> **Private subnets**: do NOT enable auto-assign public IP.

### Step 4: Create Route Tables

**Public Route Table:**

1. **Route tables** → **Create route table**
   - **Name:** `nutritrack-api-public-rt`
   - **VPC:** `nutritrack-api-vpc`
2. After creation → **Routes** tab → **Edit routes** → **Add route**:
   - Destination: `0.0.0.0/0`
   - Target: Internet Gateway → `nutritrack-api-igw`
3. **Subnet associations** tab → **Edit** → select both public subnets → **Save**

**Private Route Table** (usually created automatically, ensure it has NO route to IGW):

1. Create or find a route table with no `0.0.0.0/0` route
2. Associate `private-subnet-ecs01` and `private-subnet-ecs02` to this table

### Step 5: Create ECR Repository

```bash
# AWS CLI — creates the repo where your Docker image lives
aws ecr create-repository \
  --repository-name backend/nutritrack-api-image \
  --region ap-southeast-2 \
  --image-scanning-configuration scanOnPush=true

# Note the repositoryUri from the output — you'll need it later
# Format: 966000660990.dkr.ecr.ap-southeast-2.amazonaws.com/backend/nutritrack-api-image
```

### Step 6: Build & Push Docker Image (ARM64)

ECS Fargate uses ARM Graviton — build for `linux/arm64` to save ~20% cost over x86.

```bash
# Step 6.1 — Login to ECR
aws ecr get-login-password --region ap-southeast-2 \
  | docker login --username AWS --password-stdin \
    966000660990.dkr.ecr.ap-southeast-2.amazonaws.com

# Step 6.2 — Enable multi-arch builds (one-time setup)
docker buildx create --use --name nutritrack-builder

# Step 6.3 — Build ARM64 image and push directly to ECR
docker buildx build \
  --platform linux/arm64 \
  --tag 966000660990.dkr.ecr.ap-southeast-2.amazonaws.com/backend/nutritrack-api-image:arm \
  --push \
  .
```

> **Why ARM64?** AWS Graviton processors deliver ~20% better price/performance than x86 for Python workloads. Combined with Fargate Spot, this reduces cost by up to **70%** compared to standard x86 Fargate.

### Step 7: Create Secrets Manager Secret

Your API keys (e.g., `NUTRITRACK_API_KEY`) should never be stored as plaintext environment variables.

```bash
# Create secret with all API keys in one JSON blob
aws secretsmanager create-secret \
  --name "nutritrack/prod/api-keys" \
  --region ap-southeast-2 \
  --secret-string '{
    "NUTRITRACK_API_KEY": "your_api_key_here",
    "USDA_API_KEY": "your_usda_key_here"
  }'

# Note the ARN from output — format:
# arn:aws:secretsmanager:ap-southeast-2:966000660990:secret:nutritrack/prod/api-keys-XXXXXX
```

### Step 8: Create IAM Roles

ECS needs **two separate roles** — many beginners confuse them:

| Role                   | Used By                    | Purpose                                                                             |
| ---------------------- | -------------------------- | ----------------------------------------------------------------------------------- |
| `ecsTaskExecutionRole` | ECS Agent (system)         | Pull image from ECR, write logs to CloudWatch, read secrets before container starts |
| `ecsTaskRole`          | Your Python code (runtime) | Call Bedrock, read/write S3 — anything `boto3` needs                                |

**8.1 — Create `ecsTaskRole` (runtime permissions for your code)**

Go to **IAM** → **Roles** → **Create role**:
- **Trusted entity:** AWS Service → **Elastic Container Service Task**
- Click **Next** → skip adding managed policies for now
- **Name:** `nutritrack-ecs-task-role`
- **Create role**

After creation, **Add permissions** → **Create inline policy** → paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3CacheAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::nutritrack-cache-01apr26",
        "arn:aws:s3:::nutritrack-cache-01apr26/*"
      ]
    }
  ]
}
```

Name this inline policy: `NutriTrackTaskPolicy`

**8.2 — Update `ecsTaskExecutionRole` (add Secrets Manager & ECR access)**

Find the existing `ecsTaskExecutionRole` (created automatically by ECS). Add an inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SecretsAccess",
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "arn:aws:secretsmanager:ap-southeast-2:966000660990:secret:nutritrack/prod/api-keys-*"
    }
  ]
}
```

The existing `AmazonECSTaskExecutionRolePolicy` already covers ECR image pull and CloudWatch log writing.

### Step 9: Create ECS Cluster

1. Go to **ECS** → **Clusters** → **Create cluster**
2. Fill in:
   - **Cluster name:** `nutritrack-api-cluster`
   - **Infrastructure:** tick **AWS Fargate (serverless)**
3. Click **Create**

### Step 10: Create Task Definition

1. **Task definitions** → **Create new task definition** → **Create new task definition with JSON**

Paste the following JSON (replace ARNs with your actual values):

```json
{
  "family": "arm-nutritrack-api-task",
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::966000660990:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::966000660990:role/nutritrack-ecs-task-role",
  "runtimePlatform": {
    "operatingSystemFamily": "LINUX",
    "cpuArchitecture": "ARM64"
  },
  "containerDefinitions": [
    {
      "name": "arm-nutritrack-api-container",
      "image": "966000660990.dkr.ecr.ap-southeast-2.amazonaws.com/backend/nutritrack-api-image:arm",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8000,
          "hostPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "AWS_REGION", "value": "ap-southeast-2" },
        { "name": "MODEL_ID", "value": "qwen.qwen3-vl-235b-a22b" }
      ],
      "secrets": [
        {
          "name": "NUTRITRACK_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:ap-southeast-2:966000660990:secret:nutritrack/prod/api-keys-XXXXXX:NUTRITRACK_API_KEY::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/arm-nutritrack-api-task",
          "awslogs-region": "ap-southeast-2",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 30,
        "timeout": 10,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

> **Note on `secrets` syntax:** The format is `<secret-ARN>:<key-name>::` — the two trailing colons are required. Missing them causes `ResourceInitializationError`.

### Step 11: Create Security Groups

**ALB Security Group (`nutritrack-api-vpc-alb-sg`):**

1. EC2 Console → **Security Groups** → **Create security group**
2. Name: `nutritrack-api-vpc-alb-sg` | VPC: `nutritrack-api-vpc`
3. Inbound rules:
   - Type: HTTP | Port: `80` | Source: `0.0.0.0/0, ::/0`
4. Outbound: All traffic → Anywhere

**ECS Task Security Group (`nutritrack-api-vpc-ecs-sg`):**

1. Create another security group: `nutritrack-api-vpc-ecs-sg`
2. Inbound:
   - Type: Custom TCP | Port: `8000` | Source: *select `nutritrack-api-vpc-alb-sg`* (not an IP!)
3. Outbound: All traffic → Anywhere

> **Security Group Chain:** Fargate tasks only accept connections from the ALB's SG. Even if someone discovers the internal IP, they cannot connect directly — they must go through the ALB. This is why we never use an IP range as the source for the ECS SG inbound rule.

**VPC Endpoints Security Group (`nutritrack-api-vpc-endpoints-sg`):**

1. Name: `nutritrack-api-vpc-endpoints-sg`
2. Inbound:
   - Type: HTTPS | Port: `443` | Source: `10.0.0.0/16` (entire VPC CIDR)
3. Outbound: All traffic

### Step 12: Create 5 VPC Endpoints

VPC Endpoints replace NAT Gateway for AWS service access. The private subnets use these to reach Bedrock, ECR, etc. without any internet traffic.

Go to **VPC** → **Endpoints** → **Create endpoint** for each:

**12.1 — S3 Gateway Endpoint (free!)**

- **Name:** `nutritrack-api-vpc-s3-ep`
- **Service:** search `com.amazonaws.ap-southeast-2.s3` → select type **Gateway**
- **VPC:** `nutritrack-api-vpc`
- **Route tables:** select the **private** route table(s)
- No SG needed for Gateway endpoints

**12.2 — Bedrock Runtime (Interface)**

- **Name:** `nutritrack-api-vpc-bedrock-ep`
- **Service:** `com.amazonaws.ap-southeast-2.bedrock-runtime` → **Interface**
- **Subnets:** select `private-subnet-ecs01` and `private-subnet-ecs02`
- **Security group:** `nutritrack-api-vpc-endpoints-sg`
- Enable **Private DNS**

**12.3 — ECR API (Interface)**

- **Name:** `nutritrack-api-vpc-api-ecr-ep`
- **Service:** `com.amazonaws.ap-southeast-2.ecr.api` → **Interface**
- Same subnets + SG as above, enable Private DNS

**12.4 — ECR DKR (Interface)**

- **Name:** `nutritrack-api-dkr-ecr-ep`
- **Service:** `com.amazonaws.ap-southeast-2.ecr.dkr` → **Interface**
- Same subnets + SG, enable Private DNS

**12.5 — Secrets Manager (Interface)**

- **Name:** `nutritrack-api-vpc-sm-ep`
- **Service:** `com.amazonaws.ap-southeast-2.secretsmanager` → **Interface**
- Same subnets + SG, enable Private DNS

**12.6 — CloudWatch Logs (Interface)**

- **Name:** `nutritrack-api-vpc-cw-ep`
- **Service:** `com.amazonaws.ap-southeast-2.logs` → **Interface**
- Same subnets + SG, enable Private DNS

> **Cost note:** Interface VPC Endpoints cost ~$7.20/month per endpoint per AZ. With 4 Interface endpoints × 2 AZs = ~$57.6/month for endpoints + S3 Gateway (free). This is still cheaper than NAT Gateway (~$32/month/AZ just for the gateway itself, before data transfer charges).

### Step 13: Create Target Group

1. **EC2 Console** → **Target Groups** → **Create target group**
2. **Target type:** `IP addresses` ← **CRITICAL** — Fargate requires IP, not Instance
3. Fill in:
   - **Name:** `nutritrack-api-vpc-tg`
   - **Protocol / Port:** `HTTP` / `8000`
   - **VPC:** `nutritrack-api-vpc`
4. **Health checks:**
   - **Protocol:** HTTP
   - **Path:** `/health`
   - **Healthy threshold:** `2`
   - **Unhealthy threshold:** `3`
   - **Timeout:** `10s`
   - **Interval:** `30s`
5. Click **Next** → **Create target group** (do not add targets manually; ECS registers them)

### Step 14: Create Application Load Balancer

1. **EC2** → **Load Balancers** → **Create Load Balancer** → **Application Load Balancer**
2. Fill in:
   - **Name:** `nutritrack-api-vpc-alb`
   - **Scheme:** Internet-facing
   - **IP address type:** IPv4
3. **Network mapping:**
   - VPC: `nutritrack-api-vpc`
   - Availability Zones: tick `ap-southeast-2a` → `public-alb01` and `ap-southeast-2c` → `public-alb02`
4. **Security group:** select `nutritrack-api-vpc-alb-sg`
5. **Listeners and routing:**
   - Protocol: HTTP, Port: `80`
   - Default action: Forward to → `nutritrack-api-vpc-tg`
6. Click **Create load balancer**

Note the **ALB DNS name** — this is your public API endpoint (e.g., `nutritrack-api-vpc-alb-1234567890.ap-southeast-2.elb.amazonaws.com`).

### Step 15: Create ECS Service

1. Go to **ECS** → Cluster `nutritrack-api-cluster` → **Services** → **Create**
2. **Environment (Compute configuration):**
   - Select **Capacity provider strategy** (not Launch type)
   - Click **Add capacity provider** → `FARGATE_SPOT` → Weight: `1`
3. **Deployment configuration:**
   - **Application type:** Service
   - **Task definition:** `arm-nutritrack-api-task` (latest revision)
   - **Service name:** `spot-arm-nutritrack-api-task-service`
   - **Desired tasks:** `2`
4. **Networking:**
   - **VPC:** `nutritrack-api-vpc`
   - **Subnets:** select `private-subnet-ecs01` AND `private-subnet-ecs02`
   - **Security group:** `nutritrack-api-vpc-ecs-sg`
   - **Auto-assign public IP:** **DISABLED** (container is private)
5. **Load balancing:**
   - **Load balancer type:** Application Load Balancer
   - **Load balancer:** `nutritrack-api-vpc-alb`
   - **Container to load balance:** `arm-nutritrack-api-container`: `8000:8000`
   - **Target group:** `nutritrack-api-vpc-tg`
6. Click **Create**

Wait for both tasks to show **RUNNING** status (~2-3 minutes).

### Step 16: Configure Auto Scaling

Auto Scaling automatically adds/removes tasks based on CPU utilization.

**16.1 — Register Scalable Target**

```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id "service/nutritrack-api-cluster/spot-arm-nutritrack-api-task-service" \
  --min-capacity 1 \
  --max-capacity 10
```

**16.2 — Create Scale-Out Policy (CPU > 70% → add task)**

```bash
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id "service/nutritrack-api-cluster/spot-arm-nutritrack-api-task-service" \
  --policy-name "nutritrack-api-cluster-cpu-above-70" \
  --policy-type StepScaling \
  --step-scaling-policy-configuration '{
    "AdjustmentType": "PercentChangeInCapacity",
    "StepAdjustments": [
      { "MetricIntervalLowerBound": 0, "ScalingAdjustment": 10 }
    ],
    "Cooldown": 300
  }'
```

**16.3 — Create Scale-In Policy (CPU < 20% → remove task)**

```bash
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id "service/nutritrack-api-cluster/spot-arm-nutritrack-api-task-service" \
  --policy-name "nutritrack-api-cluster-cpu-below-20" \
  --policy-type StepScaling \
  --step-scaling-policy-configuration '{
    "AdjustmentType": "PercentChangeInCapacity",
    "StepAdjustments": [
      { "MetricIntervalUpperBound": 0, "ScalingAdjustment": -10 }
    ],
    "Cooldown": 300
  }'
```

**16.4 — Create CloudWatch Alarms**

Retrieve the policy ARNs from the previous commands, then create alarms:

```bash
# Get scale-out policy ARN
SCALEOUT_ARN=$(aws application-autoscaling describe-scaling-policies \
  --service-namespace ecs \
  --resource-id "service/nutritrack-api-cluster/spot-arm-nutritrack-api-task-service" \
  --query "ScalingPolicies[?PolicyName=='nutritrack-api-cluster-cpu-above-70'].PolicyARN" \
  --output text)

# Scale-OUT alarm: CPU > 70% for 2 consecutive periods → add 10% capacity
aws cloudwatch put-metric-alarm \
  --alarm-name "nutritrack-api-cluster-cpu-above-70-alarm" \
  --alarm-description "Scale out when CPU exceeds 70% for 2 minutes (add 10% capacity)" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 60 \
  --evaluation-periods 2 \
  --threshold 70 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --dimensions \
    "Name=ClusterName,Value=nutritrack-api-cluster" \
    "Name=ServiceName,Value=spot-arm-nutritrack-api-task-service" \
  --alarm-actions "$SCALEOUT_ARN" \
  --treat-missing-data notBreaching

# Get scale-in policy ARN
SCALEIN_ARN=$(aws application-autoscaling describe-scaling-policies \
  --service-namespace ecs \
  --resource-id "service/nutritrack-api-cluster/spot-arm-nutritrack-api-task-service" \
  --query "ScalingPolicies[?PolicyName=='nutritrack-api-cluster-cpu-below-20'].PolicyARN" \
  --output text)

# Scale-IN alarm: CPU < 20% for 5 consecutive periods → remove 10% capacity
aws cloudwatch put-metric-alarm \
  --alarm-name "nutritrack-api-cluster-cpu-below-20-alarm" \
  --alarm-description "Scale in when CPU drops below 20% for 5 minutes (remove 10% capacity)" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 60 \
  --evaluation-periods 5 \
  --threshold 20 \
  --comparison-operator LessThanOrEqualToThreshold \
  --dimensions \
    "Name=ClusterName,Value=nutritrack-api-cluster" \
    "Name=ServiceName,Value=spot-arm-nutritrack-api-task-service" \
  --alarm-actions "$SCALEIN_ARN" \
  --treat-missing-data notBreaching
```

**How Auto Scaling works:**

| Alarm                | Trigger             | Action  | Cooldown |
| -------------------- | ------------------- | ------- | -------- |
| `cpu-above-70-alarm` | CPU ≥ 70% for 2 min | +10% tasks | 300s     |
| `cpu-below-20-alarm` | CPU ≤ 20% for 5 min | -10% tasks | 300s     |

> The symmetric cooldown (300s for both) prevents oscillation — it provides a balanced response to capacity changes.

### Step 17: Verify Deployment

```bash
# 1. Check service status
aws ecs describe-services \
  --cluster nutritrack-api-cluster \
  --services spot-arm-nutritrack-api-task-service \
  --query 'services[0].{Running:runningCount,Desired:desiredCount,Status:status}' \
  --output table

# 2. Test the health endpoint via ALB
ALB_DNS="nutritrack-api-vpc-alb-XXXXXXX.ap-southeast-2.elb.amazonaws.com"
curl http://$ALB_DNS/health
# Expected: {"status": "healthy"}

# 3. Check CloudWatch alarms
aws cloudwatch describe-alarms \
  --alarm-names \
    "nutritrack-api-cluster-cpu-above-70-alarm" \
    "nutritrack-api-cluster-cpu-below-20-alarm" \
  --query 'MetricAlarms[].{Name:AlarmName,State:StateValue}' \
  --output table

# 4. Check VPC endpoints are available
aws ec2 describe-vpc-endpoints \
  --filters "Name=vpc-id,Values=$(aws ec2 describe-vpcs \
    --filters 'Name=tag:Name,Values=nutritrack-api-vpc' \
    --query 'Vpcs[0].VpcId' --output text)" \
  --query 'VpcEndpoints[].{Name:Tags[?Key==`Name`].Value|[0],State:State}' \
  --output table
```

> 🎯 **Checkpoint:** 2 Fargate tasks running, ALB returns `{"status": "healthy"}`, both CloudWatch alarms in `OK` state.

---

## Path B — Terraform (Infrastructure as Code)

Terraform lets you define the entire infrastructure in code, version-control it, and reproduce it consistently.

### Step B.1: Project Structure

```
infra/private-ecs/
├── provider.tf      # AWS provider + backend config
├── variables.tf     # Input variables
├── vpc.tf           # VPC, subnets, IGW, route tables, VPC Endpoints
├── security.tf      # Security groups
├── iam.tf           # Task execution role + task role
├── ecs.tf           # Cluster, task definition, service
├── alb.tf           # ALB, target group, listener
├── autoscaling.tf   # Auto scaling target + policy
└── data.tf          # Data sources (AZs, ECR, Secrets Manager)
```

### Step B.2: Key Files

**`provider.tf`**
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

**`variables.tf`**
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

**`vpc.tf`** (key section — no NAT gateway)
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
  enable_nat_gateway = false
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

# Interface Endpoints (Bedrock, ECR, Secrets Manager, CloudWatch)
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

**`autoscaling.tf`**
```hcl
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 10
  min_capacity       = 0
  resource_id        = "service/${aws_ecs_cluster.api.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu_scaling" {
  name               = "nutritrack-api-cluster-cpu-above-70"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0   # Scale out when CPU > 70%
    scale_in_cooldown  = 300    # Wait 5 min before scaling in
    scale_out_cooldown = 300    # Wait 5 min before scaling out (prevent rapid flutter)
  }
}
```

### Step B.3: Deploy

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

### Step B.4: Destroy (Cleanup)

```bash
terraform destroy -auto-approve
```

---

## Path C — GitHub Actions CI/CD

Automate builds and deployments on every push to `main`.

### Step C.1: GitHub Repository Secrets

Go to your repo → **Settings** → **Secrets and variables** → **Actions**, then add:

| Secret Name                 | Value                               |
| --------------------------- | ----------------------------------- |
| `AWS_ACCESS_KEY_ID`         | IAM user access key                 |
| `AWS_SECRET_ACCESS_KEY`     | IAM user secret key                 |
| `NUTRITRACK_API_KEY`        | Your NutriTrack API key (for tests) |
| `USDA_API_KEY`              | USDA FoodData Central API key       |
| `AVOCAVO_NUTRITION_API_KEY` | Avocavo Nutrition API key           |

### Step C.2: Required IAM Permissions for `github-actions-deployer`

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
      "Sid": "CloudWatchPermissions",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:DescribeAlarms",
        "cloudwatch:PutMetricAlarm"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SupportPermissions",
      "Effect": "Allow",
      "Action": [
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

### Step C.3: Workflow File

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
  AWS_REGION:         ap-southeast-2
  ECR_REGISTRY:       966000660990.dkr.ecr.ap-southeast-2.amazonaws.com
  ECR_REPOSITORY:     backend/nutritrack-api-image
  ECS_CLUSTER:        nutritrack-api-cluster
  ECS_SERVICE:        spot-arm-nutritrack-api-task-service
  TASK_DEFINITION:    arm-nutritrack-api-task
  CONTAINER_NAME:     arm-nutritrack-api-container
  S3_BUCKET:          nutritrack-cache-01apr26
  IMAGE_TAG:          arm

jobs:
  # JOB 1: Secret scan (gitleaks)
  scan:
    name: "🛡️ Scan Secrets"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # JOB 2: Run pytest
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

  # JOB 3: Build ARM64 image → ECR
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

  # JOB 4: Sync S3 cache
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

  # JOB 5: Deploy to ECS
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

### Step C.4: Pipeline Flow

```
git push main
     │
     ├─► JOB 1: Gitleaks secret scan (blocks pipeline if secrets found)
     │
     ├─► JOB 2: pytest (soft fail — pipeline continues even if tests fail)
     │
     ├─► JOB 3: Build ARM64 image → push to ECR (QEMU cross-compile)
     │
     ├─► JOB 4: Merge + upload cache JSONs to S3
     │
     └─► JOB 5: Force new ECS deployment → wait for stable → update Auto Scaling
```

**Total pipeline time:** ~10-15 minutes

---

## Troubleshooting

### ❌ Task fails with `ResourceInitializationError`

**Cause:** Container cannot pull image or read secrets before starting.

**Check:**
1. VPC Endpoints for `ecr.api`, `ecr.dkr`, `secretsmanager` are all in `Available` state
2. Endpoint Security Group allows HTTPS (port 443) from VPC CIDR `10.0.0.0/16`
3. `ecsTaskExecutionRole` has `secretsmanager:GetSecretValue` permission
4. Secret ARN in Task Definition uses the correct format: `<ARN>:<KEY_NAME>::`

```bash
# Check why a specific task stopped
aws ecs describe-tasks \
  --cluster nutritrack-api-cluster \
  --tasks <TASK_ID> \
  --query 'tasks[0].stoppedReason'
```

### ❌ ALB health checks failing (targets are unhealthy)

**Cause:** Container not returning HTTP 200 on `/health`, or security group blocking ALB → ECS traffic.

**Check:**
1. Make sure your FastAPI app has a `/health` endpoint returning `{"status": "healthy"}`
2. ECS SG inbound rule source is the **ALB Security Group ID**, not a CIDR
3. Container is actually running (check CloudWatch logs)

```bash
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn <TG_ARN> \
  --query 'TargetHealthDescriptions[].{Target:Target.Id,Health:TargetHealth.State,Reason:TargetHealth.Description}'
```

### ❌ ARM64 image crashes immediately

**Cause:** Built for wrong architecture (x86 image deployed to ARM task).

**Fix:** Verify the task definition has `cpuArchitecture: ARM64` and the image was built with `--platform linux/arm64`.

```bash
# Confirm architecture in task def
aws ecs describe-task-definition \
  --task-definition arm-nutritrack-api-task \
  --query 'taskDefinition.runtimePlatform'
```

### ❌ Fargate Spot task interrupted

**Cause:** AWS reclaimed Spot capacity (normal behavior).

**What happens:** ECS automatically starts a replacement Spot task. If Spot is unavailable, consider adding `FARGATE` as a fallback capacity provider with lower weight.

```bash
# Force restart service if not recovering
aws ecs update-service \
  --cluster nutritrack-api-cluster \
  --service spot-arm-nutritrack-api-task-service \
  --force-new-deployment
```

---

## Cost Breakdown

| Component                                        | Cost/Month     |
| ------------------------------------------------ | -------------- |
| ECS Fargate Spot ARM (1 vCPU, 2GB, 2 tasks 24/7) | ~$20           |
| ALB (fixed + LCU)                                | ~$16-20        |
| VPC Interface Endpoints (×4 types × 2 AZs)       | ~$57           |
| S3 Gateway Endpoint                              | Free           |
| ECR storage (~500 MB)                            | ~$0.05         |
| CloudWatch logs (14 days retention)              | ~$0.50         |
| Secrets Manager                                  | ~$0.40         |
| **Total**                                        | **~$95/month** |

> **Saving vs NAT Gateway:** NAT Gateway costs $32/AZ/month + $0.045/GB data processed. For 2 AZs that's $64+ before data costs. VPC Endpoints often cost less when combined with Fargate's direct service access needs.

---

## Cleanup

To stop incurring charges, delete resources in order:

```bash
# 1. Scale service to 0 tasks (stops billing immediately)
aws ecs update-service \
  --cluster nutritrack-api-cluster \
  --service spot-arm-nutritrack-api-task-service \
  --desired-count 0

# 2. Delete ECS service
aws ecs delete-service \
  --cluster nutritrack-api-cluster \
  --service spot-arm-nutritrack-api-task-service \
  --force

# 3. Delete ECS cluster
aws ecs delete-cluster --cluster nutritrack-api-cluster

# 4. Delete ALB and Target Group (via Console or CLI)

# 5. Delete VPC Endpoints (5 endpoints)

# 6. Delete ECR repository (and all images)
aws ecr delete-repository \
  --repository-name backend/nutritrack-api-image \
  --force

# 7. Delete Secrets Manager secret
aws secretsmanager delete-secret \
  --secret-id nutritrack/prod/api-keys \
  --force-delete-without-recovery

# 8. Delete S3 bucket (empty first)
aws s3 rm s3://nutritrack-cache-01apr26 --recursive
aws s3 rb s3://nutritrack-cache-01apr26

# 9. Delete VPC (subnets, route tables, IGW, SGs, then VPC)
# Best done via Console: VPC → Actions → Delete VPC (cascades)
```

> 🎯 **Final Checkpoint:** ALB DNS returns HTTP 200, 2 Fargate tasks running in private subnets, CloudWatch alarms are `OK`, Auto Scaling Min=1/Max=10 configured.
