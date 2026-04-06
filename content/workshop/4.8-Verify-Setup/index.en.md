## Phase 8: ECS Fargate — Private Subnet Deployment

Deploy the NutriTrack FastAPI container on **AWS ECS Fargate** inside a fully private VPC.

**No NAT Gateway** — 100% private via VPC Endpoints to minimize cost.
**Region:** `ap-southeast-2` · **AZs:** `ap-southeast-2a` and `ap-southeast-2c`

---

## Prerequisites

Before starting, make sure you have:

- An **AWS Account** with billing enabled and credit card attached
- **AWS CLI v2** installed and configured (`aws configure`)
- **Docker** installed locally (for building and pushing images)
- The NutriTrack API source code locally (with a `Dockerfile`)

> If you haven't set up ECR yet, complete section **4.2 Prerequisites** first.

> **Finding your AWS Account ID:** Sign in to the AWS Console → click your account name in the **top-right corner** → your 12-digit **Account ID** is displayed there. You will need it to replace `<YOUR_ACCOUNT_ID>` throughout this guide.

---

## Architecture Overview

![Architecture Overview](solution-architect/cicd-nutritrack-api-vpc.drawio.png)

**6 VPC Endpoints (no NAT needed):**

| Endpoint Name                   | Service           | Type      | Purpose             |
| ------------------------------- | ----------------- | --------- | ------------------- |
| `nutritrack-api-vpc-bedrock-ep` | `bedrock-runtime` | Interface | AI model calls      |
| `nutritrack-api-vpc-api-ecr-ep` | `ecr.api`         | Interface | Pull image metadata |
| `nutritrack-api-dkr-ecr-ep`     | `ecr.dkr`         | Interface | Pull Docker layers  |
| `nutritrack-api-vpc-s3-ep`      | `s3`              | Gateway   | Cache sync (free!)  |
| `nutritrack-api-vpc-sm-ep`      | `secretsmanager`  | Interface | API key retrieval   |
| `nutritrack-api-vpc-cw-ep`      | `logs`            | Interface | CloudWatch logging  |

---

## Step-by-Step AWS Console Deployment

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

### Step 4b: Create S3 Cache Bucket

The application uses S3 to cache food database lookups. Create the bucket **before** building your task definition.

1. Open **Amazon S3 Console** → **Create bucket**
2. Fill in:
   - **Bucket name:** choose a unique name, e.g. `nutritrack-cache-<yourname>` — note this name, you will use it later
   - **AWS Region:** `ap-southeast-2`
3. **Object Ownership:** ACLs disabled (recommended)
4. **Block Public Access:** leave **all** checkboxes ticked (Block all public access)
5. **Versioning:** Disabled
6. Click **Create bucket**

> **Note:** S3 bucket names must be globally unique. Once created, copy the bucket name — you will paste it as the value of `AWS_S3_CACHE_BUCKET` in the task definition's environment variables.

### Step 5: Create ECR Repository

1. Open **Amazon ECR Console** → **Repositories** → **Create repository**
2. Fill in:
   - **Visibility:** Private
   - **Repository name:** `backend/nutritrack-api-image`
3. **Image scan settings:** enable **Scan on push**
4. Click **Create repository**
5. Note the **URI** — format: `<YOUR_ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com/backend/nutritrack-api-image`

### Step 6: Build & Push Docker Image (ARM64)

ECS Fargate uses ARM Graviton — build for `linux/arm64` to save ~20% cost over x86.

```bash
# Step 6.1 — Login to ECR
aws ecr get-login-password --region ap-southeast-2 \
  | docker login --username AWS --password-stdin \
    <YOUR_ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com

# Step 6.2 — Enable multi-arch builds (one-time setup)
docker buildx create --use --name nutritrack-builder

# Step 6.3 — Build ARM64 image and push directly to ECR
docker buildx build \
  --platform linux/arm64 \
  --tag <YOUR_ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com/backend/nutritrack-api-image:arm \
  --push \
  .
```

> **Why ARM64?** AWS Graviton processors deliver ~20% better price/performance than x86 for Python workloads. Combined with Fargate Spot, this reduces cost by up to **70%** compared to standard x86 Fargate.

### Step 7: Create Secrets Manager Secret

Your API keys (e.g., `NUTRITRACK_API_KEY`) should never be stored as plaintext environment variables.

1. Open **AWS Secrets Manager Console** → **Store a new secret**
2. **Secret type:** select **Other type of secret**
3. **Key/value pairs** — add three entries:

   | Key                         | Value                   |
   | --------------------------- | ----------------------- |
   | `NUTRITRACK_API_KEY`        | `your_api_key_here`     |
   | `USDA_API_KEY`              | `your_usda_key_here`    |
   | `AVOCAVO_NUTRITION_API_KEY` | `your_avocavo_key_here` |

4. Click **Next**
5. **Secret name:** `nutritrack/prod/api-keys`
6. **Tags** (optional): `Owner` = `your_name`
7. Click **Next** → **Next** → **Store**
8. Note the **Secret ARN** — format: `arn:aws:secretsmanager:ap-southeast-2:<YOUR_ACCOUNT_ID>:secret:nutritrack/prod/api-keys-XXXXXX`

> **Important:** Copy the full Secret ARN (including the 6-character suffix at the end, e.g. `-AbCdEf`). You will need it in the task definition's `secrets` block.

### Step 8: Create IAM Roles

ECS needs **two separate roles** — many beginners confuse them:

| Role                   | Used By                    | Purpose                                                                             |
| ---------------------- | -------------------------- | ----------------------------------------------------------------------------------- |
| `ecsTaskExecutionRole` | ECS Agent (system)         | Pull image from ECR, write logs to CloudWatch, read secrets before container starts |
| `ecsTaskRole`          | Your Python code (runtime) | Call Bedrock, read/write S3, write CloudWatch logs — anything `boto3` needs         |

**8.1 — Create `ecsTaskRole` (runtime permissions for your code)**

1. Go to **IAM Console** → **Roles** → **Create role**
2. **Trusted entity type:** AWS Service
3. **Use case:** Elastic Container Service → **Elastic Container Service Task**
4. Click **Next**
5. **Attach managed policies** — search and select these three:
   - `AmazonBedrockFullAccess` — allows the container to call Bedrock models
   - `AmazonS3FullAccess` — allows the container to read/write S3 cache bucket
   - `CloudWatchLogsFullAccess` — allows the container to write application logs
6. Click **Next**
7. **Role name:** `ecsTaskRole`
8. Click **Create role**

**8.2 — Create `ecsTaskExecutionRole` (system-level permissions for ECS agent)**

1. Go to **IAM Console** → **Roles** → **Create role**
2. **Trusted entity type:** AWS Service
3. **Use case:** Elastic Container Service → **Elastic Container Service Task**
4. Click **Next**
5. **Attach managed policies** — search and select:
   - `AmazonECS_FullAccess`
   - `AmazonECSTaskExecutionRolePolicy` — covers ECR image pull and CloudWatch log writing
6. Click **Next**
7. **Role name:** `ecsTaskExecutionRole`
8. Click **Create role**

After creation, add an **inline policy** for Secrets Manager access:

1. Open role `ecsTaskExecutionRole` → **Permissions** tab → **Add permissions** → **Create inline policy**
2. Switch to **JSON** tab, paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SecretsAccess",
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "arn:aws:secretsmanager:ap-southeast-2:<YOUR_ACCOUNT_ID>:secret:nutritrack/prod/api-keys-*"
    }
  ]
}
```

> Replace `<YOUR_ACCOUNT_ID>` with your 12-digit AWS Account ID (e.g. `123456789012`).

3. **Policy name:** `NutriTrackSecretsAccess`
4. Click **Create policy**

### Step 9: Create ECS Cluster

1. Go to **ECS** → **Clusters** → **Create cluster**
2. Fill in:
   - **Cluster name:** `nutritrack-api-cluster`
   - **Infrastructure:** tick **AWS Fargate (serverless)**
3. Click **Create**

### Step 10: Create Task Definition

1. **Task definitions** → **Create new task definition** → **Create new task definition with JSON**

2. Download our production task definition:

Or paste the following JSON (replace all `<YOUR_ACCOUNT_ID>` and `<YOUR_S3_BUCKET_NAME>` with your actual values):

```json
{
  "family": "arm-nutritrack-api-task",
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::<YOUR_ACCOUNT_ID>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<YOUR_ACCOUNT_ID>:role/ecsTaskRole",
  "runtimePlatform": {
    "operatingSystemFamily": "LINUX",
    "cpuArchitecture": "ARM64"
  },
  "containerDefinitions": [
    {
      "name": "arm-nutritrack-api-container",
      "image": "<YOUR_ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com/backend/nutritrack-api-image:arm",
      "essential": true,
      "portMappings": [
        {
          "name": "arm-nutritrack-api-container-80-tcp",
          "containerPort": 8000,
          "hostPort": 8000,
          "protocol": "tcp",
          "appProtocol": "http"
        }
      ],
      "environment": [
        { "name": "AWS_REGION", "value": "ap-southeast-2" },
        { "name": "LOG_TO_FILE", "value": "False" },
        { "name": "HOSTNAME", "value": "ECS" },
        { "name": "AWS_S3_CACHE_BUCKET", "value": "<YOUR_S3_BUCKET_NAME>" }
      ],
      "secrets": [
        {
          "name": "NUTRITRACK_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:ap-southeast-2:<YOUR_ACCOUNT_ID>:secret:nutritrack/prod/api-keys-XXXXXX:NUTRITRACK_API_KEY::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/arm-nutritrack-api-task",
          "awslogs-create-group": "true",
          "awslogs-region": "ap-southeast-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

> **How to find your Secret ARN suffix:** After creating the secret in Step 7, open **Secrets Manager Console** → click the secret → copy the full ARN shown at the top. The suffix (e.g. `-AbCdEf`) is the 6 characters after the last dash.

> **Note on `secrets` syntax:** The format is `<secret-ARN>:<key-name>::` — the two trailing colons are required. Missing them causes `ResourceInitializationError`.
>
> **Note on `awslogs-create-group`:** Setting `"true"` auto-creates the CloudWatch log group `/ecs/arm-nutritrack-api-task` on first container start — no need to create it manually.

### Step 11: Create Security Groups

**ALB Security Group (`nutritrack-api-vpc-alb-sg`):**

1. EC2 Console → **Security Groups** → **Create security group**
2. **Name:** `nutritrack-api-vpc-alb-sg` | **VPC:** `nutritrack-api-vpc`
3. **Inbound rules:**

   | Type  | Port Range | Source      | Description         |
   | ----- | ---------- | ----------- | ------------------- |
   | HTTP  | 80         | `0.0.0.0/0` | Public HTTP access  |
   | HTTPS | 443        | `0.0.0.0/0` | Public HTTPS access |

4. **Outbound rules:**

   | Type       | Port Range | Destination                 | Description          |
   | ---------- | ---------- | --------------------------- | -------------------- |
   | HTTP       | 80         | `nutritrack-api-vpc-ecs-sg` | Forward to ECS tasks |
   | HTTPS      | 443        | `nutritrack-api-vpc-ecs-sg` | Forward to ECS tasks |
   | Custom TCP | 8000       | `nutritrack-api-vpc-ecs-sg` | Forward to app port  |

5. Click **Create security group**

**ECS Task Security Group (`nutritrack-api-vpc-ecs-sg`):**

1. Create another security group: `nutritrack-api-vpc-ecs-sg` | **VPC:** `nutritrack-api-vpc`
2. **Inbound rules:**

   | Type       | Port Range | Source                      | Description       |
   | ---------- | ---------- | --------------------------- | ----------------- |
   | HTTP       | 80         | `nutritrack-api-vpc-alb-sg` | Allow from ALB    |
   | HTTPS      | 443        | `nutritrack-api-vpc-alb-sg` | Allow from ALB    |
   | Custom TCP | 8000       | `nutritrack-api-vpc-alb-sg` | App port from ALB |

3. **Outbound rules:**

   | Type  | Port Range | Destination | Description                |
   | ----- | ---------- | ----------- | -------------------------- |
   | HTTP  | 80         | `0.0.0.0/0` | Internet (VPC Endpoints)   |
   | HTTPS | 443        | `0.0.0.0/0` | AWS services via endpoints |

4. Click **Create security group**

> **Security Group Chain:** Fargate tasks only accept connections from the ALB's SG. Even if someone discovers the internal IP, they cannot connect directly — they must go through the ALB. This is why we never use an IP range as the source for the ECS SG inbound rule.

**VPC Endpoints Security Group (`nutritrack-api-vpc-endpoints-sg`):**

1. Name: `nutritrack-api-vpc-endpoints-sg`
2. Inbound:
   - Type: HTTPS | Port: `443` | Source: `10.0.0.0/16` (entire VPC CIDR)
3. Outbound: All traffic

### Step 12: Create 6 VPC Endpoints

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

> **Cost note:** Interface VPC Endpoints cost \~$7.20/month per endpoint per AZ. With 5 Interface endpoints × 2 AZs = \~$72/month for endpoints + S3 Gateway (free). This is still cheaper than NAT Gateway (\~$32/month/AZ just for the gateway itself, before data transfer charges).

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

Auto Scaling automatically adds/removes tasks based on CPU utilization. We'll configure scaling policies and CloudWatch Alarms entirely via the **AWS Console**.

**16.1 — Enable Auto Scaling via Console**

1. Go to **ECS Console** → Cluster `nutritrack-api-cluster` → Service `spot-arm-nutritrack-api-task-service`
2. Click **Update Service**
3. Scroll to **Service auto scaling** → expand the section
4. Tick **Use Service Auto Scaling**
5. Set:
   - **Minimum number of tasks:** `1`
   - **Maximum number of tasks:** `10`
6. Click **Update**

**16.2 — Create Scale-Out Policy (CPU > 70% → add tasks)**

1. After updating, go back to the service → **Auto Scaling** tab → **Add scaling policy**
2. Select **Target tracking**
3. Fill in:
   - **Scaling policy name:** `nutritrack-api-cluster-scale-out`
   - **ECS service metric:** `ECSServiceAverageCPUUtilization`
   - **Target value:** `70`
   - **Scale-out cooldown period:** `120` seconds
   - **Scale-in cooldown period:** `300` seconds
4. Click **Create**

> **Target Tracking** automatically creates both scale-out and scale-in alarms for you based on the target CPU value. When CPU stays above 70% it adds tasks; when it drops well below 70% it removes tasks — with appropriate cooldowns.

**16.3 — Verify the Auto Scaling Policy**

1. Go to **ECS Console** → Cluster → Service → **Auto Scaling** tab
2. Confirm the policy `nutritrack-api-cluster-scale-out` is listed with status **Active**
3. Go to **CloudWatch Console** → **Alarms** — two alarms will have been auto-created:
   - `TargetTracking-...AlarmHigh` (triggers scale-out)
   - `TargetTracking-...AlarmLow` (triggers scale-in)

**16.4 — Monitor Auto Scaling via CloudWatch**

Target Tracking auto-creates CloudWatch alarms for you. To view and verify them:

1. Open **CloudWatch Console** → **Alarms** → **All alarms**
2. Look for two alarms with names starting with `TargetTracking-service/nutritrack-api-cluster/...`
   - `...AlarmHigh` — triggers scale-out when CPU exceeds 70%
   - `...AlarmLow` — triggers scale-in when CPU drops below the low watermark
3. Verify both alarms are in **OK** state when there is no traffic

**How Auto Scaling works:**

| Trigger             | Action                  | Cooldown |
| ------------------- | ----------------------- | -------- |
| CPU > 70% sustained | Add tasks (scale-out)   | 120s     |
| CPU drops below low | Remove tasks (scale-in) | 300s     |

> Target Tracking maintains the target CPU at 70%. Scale-out reacts quickly (120s cooldown); scale-in is more conservative (300s) to avoid removing tasks during brief traffic dips.

### Step 17: Verify Deployment

**17.1 — Verify via AWS CLI:**

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

**17.2 — Verify via AWS Console:**

**Check ECS Tasks:**

1. Go to **ECS Console** → Cluster `nutritrack-api-cluster` → **Tasks** tab
2. Verify **2 tasks** with status **RUNNING** and **Last status** = `RUNNING`
3. Click on a task → check **Container** section → **Health status** should be `HEALTHY`

**Check CloudWatch Logs:**

1. Open **CloudWatch Console** → **Log groups** → find `/ecs/arm-nutritrack-api-task`
2. Click the log group → **Log streams** tab → click the most recent stream
3. Verify you see startup logs from the FastAPI application (e.g., `Uvicorn running on 0.0.0.0:8000`)
4. If the log group doesn't exist, check that `awslogs-create-group` is set to `"true"` in the task definition

**Check CloudWatch Alarms:**

1. **CloudWatch Console** → **Alarms** → **All alarms**
2. Find `nutritrack-api-cluster-cpu-above-70-alarm` — state should be **OK** (CPU is below 70%)
3. Find `nutritrack-api-cluster-cpu-below-20-alarm` — state may be **ALARM** if no traffic (this is expected, it will trigger scale-in)

**Check ECS Service Events:**

1. Go to **ECS Console** → Cluster → Service `spot-arm-nutritrack-api-task-service` → **Events** tab
2. Look for events like:
   - `service ... has reached a steady state` — deployment successful
   - `service ... registered 1 targets in target group ...` — ALB integration working
3. If you see error events like `task stopped: ResourceInitializationError`, check VPC endpoints and IAM roles

> **Checkpoint:** 2 Fargate tasks running, ALB returns `{"status": "healthy"}`, both CloudWatch alarms are configured, logs visible in CloudWatch.

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

| Component                                        | Cost/Month      |
| ------------------------------------------------ | --------------- |
| ECS Fargate Spot ARM (1 vCPU, 2GB, 2 tasks 24/7) | ~$20            |
| ALB (fixed + LCU)                                | ~$16-20         |
| VPC Interface Endpoints (×5 types × 2 AZs)       | ~$72            |
| S3 Gateway Endpoint                              | Free            |
| ECR storage (~500 MB)                            | ~$0.05          |
| CloudWatch logs (14 days retention)              | ~$0.50          |
| Secrets Manager                                  | ~$0.40          |
| **Total**                                        | **~$110/month** |

> **Saving vs NAT Gateway:** NAT Gateway costs $32/AZ/month + $0.045/GB data processed. For 2 AZs that's $64+ before data costs. VPC Endpoints often cost less when combined with Fargate's direct service access needs.

---

## Cleanup

To stop incurring charges, delete resources **in this order** via the AWS Console:

**1. Scale down and delete ECS Service**

1. Go to **ECS Console** → Cluster `nutritrack-api-cluster` → **Services** → select `spot-arm-nutritrack-api-task-service`
2. Click **Update** → set **Desired tasks** to `0` → click **Update** (wait for tasks to stop ~1 min)
3. Select the service again → **Delete** → confirm deletion

**2. Delete ECS Cluster**

1. Go to **ECS Console** → **Clusters** → select `nutritrack-api-cluster`
2. Click **Delete cluster** → confirm

**3. Delete Auto Scaling Policy**

1. Before deleting the service, go to the service → **Auto Scaling** tab → select the policy → **Delete**
2. The associated CloudWatch alarms will be deleted automatically

**4. Delete Application Load Balancer**

1. Go to **EC2 Console** → **Load Balancers** → select `nutritrack-api-vpc-alb`
2. **Actions** → **Delete load balancer** → confirm

**5. Delete Target Group**

1. **EC2 Console** → **Target Groups** → select `nutritrack-api-vpc-tg`
2. **Actions** → **Delete** → confirm

**6. Delete VPC Endpoints (6 endpoints)**

1. Go to **VPC Console** → **Endpoints**
2. Select all 6 endpoints (`nutritrack-api-vpc-bedrock-ep`, `nutritrack-api-vpc-api-ecr-ep`, `nutritrack-api-dkr-ecr-ep`, `nutritrack-api-vpc-s3-ep`, `nutritrack-api-vpc-sm-ep`, `nutritrack-api-vpc-cw-ep`)
3. **Actions** → **Delete VPC endpoints** → confirm

**7. Delete ECR Repository**

1. Go to **Amazon ECR Console** → **Repositories**
2. Select `backend/nutritrack-api-image` → **Delete** → type `delete` to confirm

**8. Delete Secrets Manager Secret**

1. Go to **Secrets Manager Console** → select `nutritrack/prod/api-keys`
2. **Actions** → **Delete secret**
3. Set **Waiting period** to `7 days` (minimum) → **Schedule deletion**

**9. Empty and Delete S3 Bucket**

1. Go to **Amazon S3 Console** → select your cache bucket (e.g. `<YOUR_S3_BUCKET_NAME>`)
2. Click **Empty** → type `permanently delete` → **Empty**
3. After emptying, click **Delete** → type the bucket name → **Delete bucket**

**10. Delete VPC and Network Resources**

1. Go to **VPC Console** → **Security Groups** → delete the 3 custom SGs (`alb-sg`, `ecs-sg`, `endpoints-sg`)
2. **VPC Console** → **Your VPCs** → select `nutritrack-api-vpc`
3. **Actions** → **Delete VPC** → AWS will automatically delete associated subnets, route tables, and the internet gateway → confirm

**11. Delete IAM Roles**

1. Go to **IAM Console** → **Roles**
2. Search for `ecsTaskRole` → select → **Delete** → confirm
3. Search for `ecsTaskExecutionRole` → select → **Delete** → confirm

**12. Delete CloudWatch Log Groups**

1. Go to **CloudWatch Console** → **Log groups**
2. Select `/ecs/arm-nutritrack-api-task` → **Actions** → **Delete log group(s)** → confirm

> **Final Checkpoint:** ALB DNS returns HTTP 200, 2 Fargate tasks running in private subnets, CloudWatch alarms are configured, Auto Scaling Min=1/Max=10 configured.
