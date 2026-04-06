## Giai đoạn 8: ECS Fargate — Triển khai Private Subnet

Triển khai container FastAPI NutriTrack trên **AWS ECS Fargate** bên trong VPC hoàn toàn private.

**Không dùng NAT Gateway** — 100% private qua VPC Endpoints để giảm chi phí.
**Region:** `ap-southeast-2` · **AZs:** `ap-southeast-2a` và `ap-southeast-2c`

---

## Điều kiện tiên quyết

Trước khi bắt đầu, hãy chắc chắn bạn có:

- **Tài khoản AWS** đã kích hoạt billing và gắn thẻ tín dụng
- **AWS CLI v2** đã cài đặt và cấu hình (`aws configure`)
- **Docker** đã cài trên máy local (để build và push image)
- **Terraform ≥ 1.5** đã cài (tùy chọn — cho đường dẫn IaC)
- **GitHub repository** (cho đường dẫn CI/CD)
- Mã nguồn NutriTrack API trên máy local (có `Dockerfile`)

> Nếu chưa thiết lập ECR, hãy hoàn thành phần **4.2 Điều kiện tiên quyết** trước.

---

## Tổng quan Kiến trúc

![Kiến trúc Tổng quan](solution-architect/cicd-nutritrack-api-vpc.drawio.png)

**5 VPC Endpoints (không cần NAT):**

| Tên Endpoint                    | Service           | Loại      | Mục đích                  |
| ------------------------------- | ----------------- | --------- | ------------------------- |
| `nutritrack-api-vpc-bedrock-ep` | `bedrock-runtime` | Interface | Gọi mô hình AI            |
| `nutritrack-api-vpc-api-ecr-ep` | `ecr.api`         | Interface | Pull metadata image       |
| `nutritrack-api-dkr-ecr-ep`     | `ecr.dkr`         | Interface | Pull Docker layers        |
| `nutritrack-api-vpc-s3-ep`      | `s3`              | Gateway   | Đồng bộ cache (miễn phí!) |
| `nutritrack-api-vpc-sm-ep`      | `secretsmanager`  | Interface | Lấy API keys              |
| `nutritrack-api-vpc-cw-ep`      | `logs`            | Interface | CloudWatch logging        |

---

## Chọn Đường dẫn

| Đường dẫn                    | Phù hợp cho                       | Thời gian |
| ---------------------------- | --------------------------------- | --------- |
| **A — AWS Console**          | Học khái niệm từng bước           | ~2 giờ    |
| **B — Terraform (IaC)**      | Hạ tầng tái tạo, quản lý code     | ~30 phút  |
| **C — GitHub Actions CI/CD** | Tự động deploy mỗi lần `git push` | ~45 phút  |

---

## Đường dẫn A — AWS Console (Từng bước)

### Bước 1: Tạo VPC

1. Mở **VPC Console** → **Your VPCs** → **Create VPC**
2. Chọn **VPC only**
3. Điền:
   - **Name tag:** `nutritrack-api-vpc`
   - **IPv4 CIDR block:** `10.0.0.0/16`
4. Nhấn **Create VPC**

### Bước 2: Tạo Internet Gateway

1. VPC Console → **Internet gateways** → **Create internet gateway**
2. **Name:** `nutritrack-api-igw`
3. Sau khi tạo: **Actions** → **Attach to VPC** → chọn `nutritrack-api-vpc` → **Attach**

### Bước 3: Tạo Subnets (4 subnet)

Lặp lại **Create subnet** bốn lần trong `nutritrack-api-vpc`:

| Tên                                   | CIDR           | AZ                | Loại    |
| ------------------------------------- | -------------- | ----------------- | ------- |
| `nutritrack-api-public-subnet-alb01`  | `10.0.11.0/24` | `ap-southeast-2a` | Public  |
| `nutritrack-api-public-subnet-alb02`  | `10.0.12.0/24` | `ap-southeast-2c` | Public  |
| `nutritrack-api-private-subnet-ecs01` | `10.0.1.0/24`  | `ap-southeast-2a` | Private |
| `nutritrack-api-private-subnet-ecs02` | `10.0.2.0/24`  | `ap-southeast-2c` | Private |

> Chỉ với **public** subnets: sau khi tạo → chọn subnet → **Actions** → **Edit subnet settings** → bật **Auto-assign public IPv4 address** → **Save**.
>
> **Private subnets**: KHÔNG bật auto-assign public IP.

### Bước 4: Tạo Route Tables

**Public Route Table:**

1. **Route tables** → **Create route table**
   - **Name:** `nutritrack-api-public-rt`
   - **VPC:** `nutritrack-api-vpc`
2. Sau khi tạo → tab **Routes** → **Edit routes** → **Add route**:
   - Destination: `0.0.0.0/0`
   - Target: Internet Gateway → `nutritrack-api-igw`
3. Tab **Subnet associations** → **Edit** → chọn cả hai public subnets → **Save**

**Private Route Table** (thường được tạo tự động, đảm bảo KHÔNG có route đến IGW):

1. Tạo hoặc tìm route table không có route `0.0.0.0/0`
2. Gán `private-subnet-ecs01` và `private-subnet-ecs02` vào bảng này

### Bước 5: Tạo ECR Repository

```bash
# AWS CLI — tạo repo lưu trữ Docker image
aws ecr create-repository \
  --repository-name backend/nutritrack-api-image \
  --region ap-southeast-2 \
  --image-scanning-configuration scanOnPush=true

# Ghi lại repositoryUri từ output — sẽ cần ở bước sau
# Định dạng: 966000660990.dkr.ecr.ap-southeast-2.amazonaws.com/backend/nutritrack-api-image
```

### Bước 6: Build & Push Docker Image (ARM64)

ECS Fargate dùng ARM Graviton — build cho `linux/arm64` để tiết kiệm ~20% chi phí so với x86.

```bash
# Bước 6.1 — Đăng nhập ECR
aws ecr get-login-password --region ap-southeast-2 \
  | docker login --username AWS --password-stdin \
    966000660990.dkr.ecr.ap-southeast-2.amazonaws.com

# Bước 6.2 — Bật multi-arch builds (chạy 1 lần)
docker buildx create --use --name nutritrack-builder

# Bước 6.3 — Build ARM64 image và push trực tiếp lên ECR
docker buildx build \
  --platform linux/arm64 \
  --tag 966000660990.dkr.ecr.ap-southeast-2.amazonaws.com/backend/nutritrack-api-image:arm \
  --push \
  .
```

> **Tại sao ARM64?** Bộ xử lý AWS Graviton mang lại hiệu năng/giá tốt hơn ~20% so với x86 cho Python workloads. Kết hợp với Fargate Spot, giảm chi phí lên đến **70%** so với x86 Fargate tiêu chuẩn.

### Bước 7: Tạo Secrets Manager Secret

API keys (ví dụ: `NUTRITRACK_API_KEY`) không bao giờ nên lưu dưới dạng plaintext environment variables.

```bash
# Tạo secret chứa tất cả API keys trong một JSON blob
aws secretsmanager create-secret \
  --name "nutritrack/prod/api-keys" \
  --region ap-southeast-2 \
  --secret-string '{
    "NUTRITRACK_API_KEY": "your_api_key_here",
    "USDA_API_KEY": "your_usda_key_here"
  }'

# Ghi lại ARN từ output — định dạng:
# arn:aws:secretsmanager:ap-southeast-2:966000660990:secret:nutritrack/prod/api-keys-XXXXXX
```

### Bước 8: Tạo IAM Roles

ECS cần **hai role riêng biệt** — nhiều người mới hay nhầm lẫn:

| Role                   | Được dùng bởi                 | Mục đích                                                                              |
| ---------------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| `ecsTaskExecutionRole` | ECS Agent (hệ thống)          | Pull image từ ECR, ghi logs vào CloudWatch, đọc secrets trước khi container khởi động |
| `ecsTaskRole`          | Code Python của bạn (runtime) | Gọi Bedrock, đọc/ghi S3 — mọi thứ `boto3` cần                                         |

**8.1 — Tạo `ecsTaskRole` (quyền runtime cho code)**

Vào **IAM** → **Roles** → **Create role**:
- **Trusted entity:** AWS Service → **Elastic Container Service Task**
- Nhấn **Next** → bỏ qua managed policies
- **Name:** `nutritrack-ecs-task-role`
- **Create role**

Sau khi tạo, **Add permissions** → **Create inline policy** → dán:

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

Đặt tên inline policy: `NutriTrackTaskPolicy`

**8.2 — Cập nhật `ecsTaskExecutionRole` (thêm Secrets Manager & ECR access)**

Tìm `ecsTaskExecutionRole` đã tồn tại (được ECS tạo tự động). Thêm inline policy:

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

`AmazonECSTaskExecutionRolePolicy` đã có sẵn đã bao gồm quyền pull ECR image và ghi CloudWatch logs.

### Bước 9: Tạo ECS Cluster

1. Vào **ECS** → **Clusters** → **Create cluster**
2. Điền:
   - **Cluster name:** `nutritrack-api-cluster`
   - **Infrastructure:** tick **AWS Fargate (serverless)**
3. Nhấn **Create**

### Bước 10: Tạo Task Definition

1. **Task definitions** → **Create new task definition** → **Create new task definition with JSON**

Dán JSON sau (thay ARN bằng giá trị thực tế của bạn):

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

> **Lưu ý cú pháp `secrets`:** Định dạng là `<secret-ARN>:<key-name>::` — hai dấu hai chấm cuối là bắt buộc. Thiếu chúng sẽ gây lỗi `ResourceInitializationError`.

### Bước 11: Tạo Security Groups

**ALB Security Group (`nutritrack-api-vpc-alb-sg`):**

1. EC2 Console → **Security Groups** → **Create security group**
2. Name: `nutritrack-api-vpc-alb-sg` | VPC: `nutritrack-api-vpc`
3. Inbound rules:
   - Type: HTTP | Port: `80` | Source: `0.0.0.0/0, ::/0`
4. Outbound: All traffic → Anywhere

**ECS Task Security Group (`nutritrack-api-vpc-ecs-sg`):**

1. Tạo thêm security group: `nutritrack-api-vpc-ecs-sg`
2. Inbound:
   - Type: Custom TCP | Port: `8000` | Source: *chọn `nutritrack-api-vpc-alb-sg`* (không phải IP!)
3. Outbound: All traffic → Anywhere

> **Chuỗi Security Group:** Fargate tasks chỉ nhận kết nối từ SG của ALB. Dù ai biết được internal IP cũng không thể kết nối trực tiếp — phải đi qua ALB. Đây là lý do ta không bao giờ dùng dải IP làm source cho inbound rule của ECS SG.

**VPC Endpoints Security Group (`nutritrack-api-vpc-endpoints-sg`):**

1. Name: `nutritrack-api-vpc-endpoints-sg`
2. Inbound:
   - Type: HTTPS | Port: `443` | Source: `10.0.0.0/16` (toàn bộ VPC CIDR)
3. Outbound: All traffic

### Bước 12: Tạo 5 VPC Endpoints

VPC Endpoints thay thế NAT Gateway để truy cập dịch vụ AWS. Private subnets sử dụng chúng để kết nối Bedrock, ECR, v.v. mà không cần internet traffic.

Vào **VPC** → **Endpoints** → **Create endpoint** cho mỗi endpoint:

**12.1 — S3 Gateway Endpoint (miễn phí!)**

- **Name:** `nutritrack-api-vpc-s3-ep`
- **Service:** tìm `com.amazonaws.ap-southeast-2.s3` → chọn loại **Gateway**
- **VPC:** `nutritrack-api-vpc`
- **Route tables:** chọn **private** route table(s)
- Không cần SG cho Gateway endpoints

**12.2 — Bedrock Runtime (Interface)**

- **Name:** `nutritrack-api-vpc-bedrock-ep`
- **Service:** `com.amazonaws.ap-southeast-2.bedrock-runtime` → **Interface**
- **Subnets:** chọn `private-subnet-ecs01` và `private-subnet-ecs02`
- **Security group:** `nutritrack-api-vpc-endpoints-sg`
- Bật **Private DNS**

**12.3 — ECR API (Interface)**

- **Name:** `nutritrack-api-vpc-api-ecr-ep`
- **Service:** `com.amazonaws.ap-southeast-2.ecr.api` → **Interface**
- Cùng subnets + SG như trên, bật Private DNS

**12.4 — ECR DKR (Interface)**

- **Name:** `nutritrack-api-dkr-ecr-ep`
- **Service:** `com.amazonaws.ap-southeast-2.ecr.dkr` → **Interface**
- Cùng subnets + SG, bật Private DNS

**12.5 — Secrets Manager (Interface)**

- **Name:** `nutritrack-api-vpc-sm-ep`
- **Service:** `com.amazonaws.ap-southeast-2.secretsmanager` → **Interface**
- Cùng subnets + SG, bật Private DNS

**12.6 — CloudWatch Logs (Interface)**

- **Name:** `nutritrack-api-vpc-cw-ep`
- **Service:** `com.amazonaws.ap-southeast-2.logs` → **Interface**
- Cùng subnets + SG, bật Private DNS

> **Lưu ý chi phí:** Interface VPC Endpoints tốn ~$7.20/tháng mỗi endpoint mỗi AZ. Với 4 Interface endpoints × 2 AZs = ~$57.6/tháng cho endpoints + S3 Gateway (miễn phí). Vẫn rẻ hơn NAT Gateway (~$32/tháng/AZ chỉ riêng gateway, chưa tính data transfer).

### Bước 13: Tạo Target Group

1. **EC2 Console** → **Target Groups** → **Create target group**
2. **Target type:** `IP addresses` ← **QUAN TRỌNG** — Fargate yêu cầu IP, không phải Instance
3. Điền:
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
5. Nhấn **Next** → **Create target group** (không thêm targets thủ công; ECS tự đăng ký)

### Bước 14: Tạo Application Load Balancer

1. **EC2** → **Load Balancers** → **Create Load Balancer** → **Application Load Balancer**
2. Điền:
   - **Name:** `nutritrack-api-vpc-alb`
   - **Scheme:** Internet-facing
   - **IP address type:** IPv4
3. **Network mapping:**
   - VPC: `nutritrack-api-vpc`
   - Availability Zones: tick `ap-southeast-2a` → `public-alb01` và `ap-southeast-2c` → `public-alb02`
4. **Security group:** chọn `nutritrack-api-vpc-alb-sg`
5. **Listeners and routing:**
   - Protocol: HTTP, Port: `80`
   - Default action: Forward to → `nutritrack-api-vpc-tg`
6. Nhấn **Create load balancer**

Ghi lại **ALB DNS name** — đây là API endpoint public (ví dụ: `nutritrack-api-vpc-alb-1234567890.ap-southeast-2.elb.amazonaws.com`).

### Bước 15: Tạo ECS Service

1. Vào **ECS** → Cluster `nutritrack-api-cluster` → **Services** → **Create**
2. **Environment (Compute configuration):**
   - Chọn **Capacity provider strategy** (không phải Launch type)
   - Nhấn **Add capacity provider** → `FARGATE_SPOT` → Weight: `1`
3. **Deployment configuration:**
   - **Application type:** Service
   - **Task definition:** `arm-nutritrack-api-task` (revision mới nhất)
   - **Service name:** `spot-arm-nutritrack-api-task-service`
   - **Desired tasks:** `2`
4. **Networking:**
   - **VPC:** `nutritrack-api-vpc`
   - **Subnets:** chọn `private-subnet-ecs01` VÀ `private-subnet-ecs02`
   - **Security group:** `nutritrack-api-vpc-ecs-sg`
   - **Auto-assign public IP:** **TẮT** (container là private)
5. **Load balancing:**
   - **Load balancer type:** Application Load Balancer
   - **Load balancer:** `nutritrack-api-vpc-alb`
   - **Container to load balance:** `arm-nutritrack-api-container`: `8000:8000`
   - **Target group:** `nutritrack-api-vpc-tg`
6. Nhấn **Create**

Đợi cả hai tasks hiển thị trạng thái **RUNNING** (~2-3 phút).

### Bước 16: Cấu hình Auto Scaling

Auto Scaling tự động thêm/bớt tasks dựa trên CPU utilization.

**16.1 — Đăng ký Scalable Target**

```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id "service/nutritrack-api-cluster/spot-arm-nutritrack-api-task-service" \
  --min-capacity 1 \
  --max-capacity 10
```

**16.2 — Tạo Scale-Out Policy (CPU > 70% → thêm task)**

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

**16.3 — Tạo Scale-In Policy (CPU < 20% → giảm task)**

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

**16.4 — Tạo CloudWatch Alarms**

Lấy policy ARNs từ các lệnh trước, sau đó tạo alarms:

```bash
# Lấy ARN policy scale-out
SCALEOUT_ARN=$(aws application-autoscaling describe-scaling-policies \
  --service-namespace ecs \
  --resource-id "service/nutritrack-api-cluster/spot-arm-nutritrack-api-task-service" \
  --query "ScalingPolicies[?PolicyName=='nutritrack-api-cluster-cpu-above-70'].PolicyARN" \
  --output text)

# Alarm Scale-OUT: CPU > 70% trong 2 chu kỳ liên tiếp → thêm 10% capacity
aws cloudwatch put-metric-alarm \
  --alarm-name "nutritrack-api-cluster-cpu-above-70-alarm" \
  --alarm-description "Scale out khi CPU vượt 70% trong 2 phút (thêm 10% capacity)" \
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

# Lấy ARN policy scale-in
SCALEIN_ARN=$(aws application-autoscaling describe-scaling-policies \
  --service-namespace ecs \
  --resource-id "service/nutritrack-api-cluster/spot-arm-nutritrack-api-task-service" \
  --query "ScalingPolicies[?PolicyName=='nutritrack-api-cluster-cpu-below-20'].PolicyARN" \
  --output text)

# Alarm Scale-IN: CPU < 20% trong 5 chu kỳ liên tiếp → giảm 10% capacity
aws cloudwatch put-metric-alarm \
  --alarm-name "nutritrack-api-cluster-cpu-below-20-alarm" \
  --alarm-description "Scale in khi CPU giảm dưới 20% trong 5 phút (giảm 10% capacity)" \
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

**Cách Auto Scaling hoạt động:**

| Alarm                | Điều kiện kích hoạt    | Hành động  | Cooldown |
| -------------------- | ---------------------- | ---------- | -------- |
| `cpu-above-70-alarm` | CPU ≥ 70% trong 2 phút | +10% tasks | 300s     |
| `cpu-below-20-alarm` | CPU ≤ 20% trong 5 phút | -10% tasks | 300s     |

> Cooldown đối xứng (300s cho cả hai) ngăn dao động — phản ứng cân bằng và ổn định với sự thay đổi capacity.

### Bước 17: Xác nhận Triển khai

```bash
# 1. Kiểm tra trạng thái service
aws ecs describe-services \
  --cluster nutritrack-api-cluster \
  --services spot-arm-nutritrack-api-task-service \
  --query 'services[0].{Running:runningCount,Desired:desiredCount,Status:status}' \
  --output table

# 2. Test health endpoint qua ALB
ALB_DNS="nutritrack-api-vpc-alb-XXXXXXX.ap-southeast-2.elb.amazonaws.com"
curl http://$ALB_DNS/health
# Kỳ vọng: {"status": "healthy"}

# 3. Kiểm tra CloudWatch alarms
aws cloudwatch describe-alarms \
  --alarm-names \
    "nutritrack-api-cluster-cpu-above-70-alarm" \
    "nutritrack-api-cluster-cpu-below-20-alarm" \
  --query 'MetricAlarms[].{Name:AlarmName,State:StateValue}' \
  --output table

# 4. Kiểm tra VPC endpoints hoạt động
aws ec2 describe-vpc-endpoints \
  --filters "Name=vpc-id,Values=$(aws ec2 describe-vpcs \
    --filters 'Name=tag:Name,Values=nutritrack-api-vpc' \
    --query 'Vpcs[0].VpcId' --output text)" \
  --query 'VpcEndpoints[].{Name:Tags[?Key==`Name`].Value|[0],State:State}' \
  --output table
```

> 🎯 **Checkpoint:** 2 Fargate tasks đang chạy, ALB trả về `{"status": "healthy"}`, cả hai CloudWatch alarms ở trạng thái `OK`.

---

## Đường dẫn B — Terraform (Infrastructure as Code)

Terraform cho phép định nghĩa toàn bộ hạ tầng bằng code, quản lý phiên bản, và tái tạo nhất quán.

### Bước B.1: Cấu trúc dự án

```
infra/private-ecs/
├── provider.tf      # AWS provider + backend config
├── variables.tf     # Biến đầu vào
├── vpc.tf           # VPC, subnets, IGW, route tables, VPC Endpoints
├── security.tf      # Security groups
├── iam.tf           # Task execution role + task role
├── ecs.tf           # Cluster, task definition, service
├── alb.tf           # ALB, target group, listener
├── autoscaling.tf   # Auto scaling target + policy
└── data.tf          # Data sources (AZs, ECR, Secrets Manager)
```

### Bước B.2: Các file chính

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

**`vpc.tf`** (phần chính — không NAT gateway)
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

  # Không NAT Gateway — 100% private qua VPC Endpoints
  enable_nat_gateway = false
  enable_dns_hostnames = true
  enable_dns_support   = true
}

# S3 Gateway Endpoint (miễn phí)
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
# (lặp lại cho ecr.api, ecr.dkr, secretsmanager, logs)
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
    target_value       = 70.0   # Scale out khi CPU > 70%
    scale_in_cooldown  = 300    # Đợi 5 phút trước khi scale in
    scale_out_cooldown = 300    # Scale out (300s) để tránh thay đổi quá nhanh
  }
}
```

### Bước B.3: Triển khai

```bash
cd infra/private-ecs

# Khởi tạo providers
terraform init

# Xem trước những gì sẽ tạo
terraform plan

# Áp dụng (mất ~5 phút)
terraform apply -auto-approve

# Lấy ALB DNS sau deploy
terraform output alb_dns_name
```

### Bước B.4: Hủy (Dọn dẹp)

```bash
terraform destroy -auto-approve
```

---

## Đường dẫn C — GitHub Actions CI/CD

Tự động hóa build và deploy mỗi lần push lên `main`.

### Bước C.1: GitHub Repository Secrets

Vào repo → **Settings** → **Secrets and variables** → **Actions**, thêm:

| Tên Secret                  | Giá trị                        |
| --------------------------- | ------------------------------ |
| `AWS_ACCESS_KEY_ID`         | Access key của IAM user        |
| `AWS_SECRET_ACCESS_KEY`     | Secret key của IAM user        |
| `NUTRITRACK_API_KEY`        | API key NutriTrack (cho tests) |
| `USDA_API_KEY`              | API key USDA FoodData Central  |
| `AVOCAVO_NUTRITION_API_KEY` | API key Avocavo Nutrition      |

### Bước C.2: Quyền IAM cần thiết cho `github-actions-deployer`

Tạo IAM user với policy này:

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

### Bước C.3: File Workflow

Tạo `.github/workflows/deploy-private-ecs.yaml`:

```yaml
name: 🚀 Deploy NutriTrack API → Private ECS (ECR + Spot)

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      skip_tests:
        description: "⚠️ Bỏ qua pytest dù tests fail"
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
  # JOB 1: Quét secret (gitleaks)
  scan:
    name: "🛡️ Quét Secrets"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # JOB 2: Chạy pytest
  test:
    name: "🧪 Test (pytest)"
    runs-on: ubuntu-latest
    needs: scan
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.10.11", cache: pip }
      - run: pip install -r requirements-dev.txt
      - name: Chạy tests
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

  # JOB 4: Đồng bộ S3 cache
  sync-cache:
    name: "🗄️ Đồng bộ Cache → S3"
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
      - name: Đồng bộ cache files lên S3
        run: |
          for file in data/usda_cache.json data/avocavo_cache.json data/openfoodfacts_cache.json; do
            [ -f "$file" ] && aws s3 cp "$file" "s3://${{ env.S3_BUCKET }}/$(basename $file)"
          done

  # JOB 5: Deploy lên ECS
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
      - name: Buộc deployment mới
        run: |
          aws ecs update-service \
            --cluster ${{ env.ECS_CLUSTER }} \
            --service ${{ env.ECS_SERVICE }} \
            --task-definition ${{ env.TASK_DEFINITION }} \
            --desired-count 2 \
            --force-new-deployment \
            --capacity-provider-strategy capacityProvider=FARGATE_SPOT,weight=1
      - name: Đợi ổn định
        run: |
          aws ecs wait services-stable \
            --cluster ${{ env.ECS_CLUSTER }} \
            --services ${{ env.ECS_SERVICE }}
      - name: Cập nhật giới hạn Auto Scaling
        run: |
          aws application-autoscaling register-scalable-target \
            --service-namespace ecs \
            --scalable-dimension ecs:service:DesiredCount \
            --resource-id "service/${{ env.ECS_CLUSTER }}/${{ env.ECS_SERVICE }}" \
            --min-capacity 1 \
            --max-capacity 10
```

### Bước C.4: Luồng Pipeline

```
git push main
     │
     ├─► JOB 1: Gitleaks quét secrets (chặn pipeline nếu tìm thấy secrets)
     │
     ├─► JOB 2: pytest (soft fail — pipeline tiếp tục dù tests fail)
     │
     ├─► JOB 3: Build ARM64 image → push lên ECR (QEMU cross-compile)
     │
     ├─► JOB 4: Merge + upload cache JSONs lên S3
     │
     └─► JOB 5: Buộc ECS deployment mới → đợi ổn định → cập nhật Auto Scaling
```

**Tổng thời gian pipeline:** ~10-15 phút

---

## Xử lý Sự cố

### ❌ Task lỗi `ResourceInitializationError`

**Nguyên nhân:** Container không thể pull image hoặc đọc secrets trước khi khởi động.

**Kiểm tra:**
1. VPC Endpoints cho `ecr.api`, `ecr.dkr`, `secretsmanager` đều ở trạng thái `Available`
2. Endpoint Security Group cho phép HTTPS (port 443) từ VPC CIDR `10.0.0.0/16`
3. `ecsTaskExecutionRole` có quyền `secretsmanager:GetSecretValue`
4. Secret ARN trong Task Definition dùng đúng định dạng: `<ARN>:<KEY_NAME>::`

```bash
# Kiểm tra lý do task dừng
aws ecs describe-tasks \
  --cluster nutritrack-api-cluster \
  --tasks <TASK_ID> \
  --query 'tasks[0].stoppedReason'
```

### ❌ ALB health checks thất bại (targets unhealthy)

**Nguyên nhân:** Container không trả HTTP 200 trên `/health`, hoặc security group chặn traffic ALB → ECS.

**Kiểm tra:**
1. Đảm bảo FastAPI app có endpoint `/health` trả về `{"status": "healthy"}`
2. ECS SG inbound rule source là **ALB Security Group ID**, không phải CIDR
3. Container thực sự đang chạy (kiểm tra CloudWatch logs)

```bash
# Kiểm tra target health
aws elbv2 describe-target-health \
  --target-group-arn <TG_ARN> \
  --query 'TargetHealthDescriptions[].{Target:Target.Id,Health:TargetHealth.State,Reason:TargetHealth.Description}'
```

### ❌ ARM64 image crash ngay lập tức

**Nguyên nhân:** Build sai kiến trúc (image x86 deploy lên ARM task).

**Cách fix:** Xác nhận task definition có `cpuArchitecture: ARM64` và image được build với `--platform linux/arm64`.

```bash
# Xác nhận kiến trúc trong task def
aws ecs describe-task-definition \
  --task-definition arm-nutritrack-api-task \
  --query 'taskDefinition.runtimePlatform'
```

### ❌ Fargate Spot task bị gián đoạn

**Nguyên nhân:** AWS thu hồi Spot capacity (hành vi bình thường).

**Điều gì xảy ra:** ECS tự động khởi động Spot task thay thế. Nếu Spot không khả dụng, cân nhắc thêm `FARGATE` làm fallback capacity provider với weight thấp hơn.

```bash
# Buộc khởi động lại service nếu không phục hồi
aws ecs update-service \
  --cluster nutritrack-api-cluster \
  --service spot-arm-nutritrack-api-task-service \
  --force-new-deployment
```

---

## Phân tích Chi phí

| Thành phần                                       | Chi phí/Tháng  |
| ------------------------------------------------ | -------------- |
| ECS Fargate Spot ARM (1 vCPU, 2GB, 2 tasks 24/7) | ~$20           |
| ALB (cố định + LCU)                              | ~$16-20        |
| VPC Interface Endpoints (×4 loại × 2 AZs)        | ~$57           |
| S3 Gateway Endpoint                              | Miễn phí       |
| ECR storage (~500 MB)                            | ~$0.05         |
| CloudWatch logs (lưu 14 ngày)                    | ~$0.50         |
| Secrets Manager                                  | ~$0.40         |
| **Tổng**                                         | **~$95/tháng** |

> **Tiết kiệm so với NAT Gateway:** NAT Gateway tốn $32/AZ/tháng + $0.045/GB data processed. Với 2 AZs thì $64+ trước data costs. VPC Endpoints thường rẻ hơn khi kết hợp với Fargate.

---

## Dọn dẹp

Để ngừng phát sinh chi phí, xóa tài nguyên theo thứ tự:

```bash
# 1. Scale service xuống 0 tasks (dừng billing ngay lập tức)
aws ecs update-service \
  --cluster nutritrack-api-cluster \
  --service spot-arm-nutritrack-api-task-service \
  --desired-count 0

# 2. Xóa ECS service
aws ecs delete-service \
  --cluster nutritrack-api-cluster \
  --service spot-arm-nutritrack-api-task-service \
  --force

# 3. Xóa ECS cluster
aws ecs delete-cluster --cluster nutritrack-api-cluster

# 4. Xóa ALB và Target Group (qua Console hoặc CLI)

# 5. Xóa VPC Endpoints (5 endpoints)

# 6. Xóa ECR repository (và tất cả images)
aws ecr delete-repository \
  --repository-name backend/nutritrack-api-image \
  --force

# 7. Xóa Secrets Manager secret
aws secretsmanager delete-secret \
  --secret-id nutritrack/prod/api-keys \
  --force-delete-without-recovery

# 8. Xóa S3 bucket (làm rỗng trước)
aws s3 rm s3://nutritrack-cache-01apr26 --recursive
aws s3 rb s3://nutritrack-cache-01apr26

# 9. Xóa VPC (subnets, route tables, IGW, SGs, rồi VPC)
# Tốt nhất qua Console: VPC → Actions → Delete VPC (tự xóa cascading)
```

> 🎯 **Checkpoint cuối:** ALB DNS trả HTTP 200, 2 Fargate tasks chạy trong private subnets, CloudWatch alarms ở trạng thái `OK`, Auto Scaling Min=1/Max=10 đã cấu hình.