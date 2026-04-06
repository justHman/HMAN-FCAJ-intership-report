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
- Mã nguồn NutriTrack API trên máy local (có `Dockerfile`)

> Nếu chưa thiết lập ECR, hãy hoàn thành phần **4.2 Điều kiện tiên quyết** trước.

> **Tìm AWS Account ID của bạn:** Đăng nhập AWS Console → nhấn vào tên tài khoản ở **góc trên bên phải** → **Account ID** 12 chữ số sẽ hiển thị ở đó. Bạn sẽ cần dùng nó để thay thế `<YOUR_ACCOUNT_ID>` trong toàn bộ hướng dẫn này.

---

## Tổng quan Kiến trúc

![Kiến trúc Tổng quan](solution-architect/cicd-nutritrack-api-vpc.drawio.png)

**6 VPC Endpoints (không cần NAT):**

| Tên Endpoint                    | Service           | Loại      | Mục đích                  |
| ------------------------------- | ----------------- | --------- | ------------------------- |
| `nutritrack-api-vpc-bedrock-ep` | `bedrock-runtime` | Interface | Gọi mô hình AI            |
| `nutritrack-api-vpc-api-ecr-ep` | `ecr.api`         | Interface | Pull metadata image       |
| `nutritrack-api-dkr-ecr-ep`     | `ecr.dkr`         | Interface | Pull Docker layers        |
| `nutritrack-api-vpc-s3-ep`      | `s3`              | Gateway   | Đồng bộ cache (miễn phí!) |
| `nutritrack-api-vpc-sm-ep`      | `secretsmanager`  | Interface | Lấy API keys              |
| `nutritrack-api-vpc-cw-ep`      | `logs`            | Interface | CloudWatch logging        |

---

## Hướng dẫn Triển khai Từng Bước qua AWS Console

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

### Bước 4b: Tạo S3 Cache Bucket

Ứng dụng dùng S3 để cache kết quả tra cứu cơ sở dữ liệu thực phẩm. Tạo bucket **trước** khi thiết lập task definition.

1. Mở **Amazon S3 Console** → **Create bucket**
2. Điền:
   - **Bucket name:** chọn tên duy nhất, ví dụ `nutritrack-cache-<yourname>` — ghi lại tên này, bạn sẽ dùng sau
   - **AWS Region:** `ap-southeast-2`
3. **Object Ownership:** ACLs disabled (khuyến nghị)
4. **Block Public Access:** giữ nguyên **tất cả** checkbox (Block all public access)
5. **Versioning:** Disabled
6. Nhấn **Create bucket**

> **Lưu ý:** Tên S3 bucket phải duy nhất trên toàn cầu. Sau khi tạo, sao chép tên bucket — bạn sẽ dán vào giá trị `AWS_S3_CACHE_BUCKET` trong environment variables của task definition.

### Bước 5: Tạo ECR Repository

1. Mở **Amazon ECR Console** → **Repositories** → **Create repository**
2. Điền:
   - **Visibility:** Private
   - **Repository name:** `backend/nutritrack-api-image`
3. **Image scan settings:** bật **Scan on push**
4. Nhấn **Create repository**
5. Ghi lại **URI** — định dạng: `<YOUR_ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com/backend/nutritrack-api-image`

### Bước 6: Build & Push Docker Image (ARM64)

ECS Fargate dùng ARM Graviton — build cho `linux/arm64` để tiết kiệm ~20% chi phí so với x86.

```bash
# Bước 6.1 — Đăng nhập ECR
aws ecr get-login-password --region ap-southeast-2 \
  | docker login --username AWS --password-stdin \
    <YOUR_ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com

# Bước 6.2 — Bật multi-arch builds (chạy 1 lần)
docker buildx create --use --name nutritrack-builder

# Bước 6.3 — Build ARM64 image và push trực tiếp lên ECR
docker buildx build \
  --platform linux/arm64 \
  --tag <YOUR_ACCOUNT_ID>.dkr.ecr.ap-southeast-2.amazonaws.com/backend/nutritrack-api-image:arm \
  --push \
  .
```

> **Tại sao ARM64?** Bộ xử lý AWS Graviton mang lại hiệu năng/giá tốt hơn ~20% so với x86 cho Python workloads. Kết hợp với Fargate Spot, giảm chi phí lên đến **70%** so với x86 Fargate tiêu chuẩn.

### Bước 7: Tạo Secrets Manager Secret

API keys (ví dụ: `NUTRITRACK_API_KEY`) không bao giờ nên lưu dưới dạng plaintext environment variables.

1. Mở **AWS Secrets Manager Console** → **Store a new secret**
2. **Secret type:** chọn **Other type of secret**
3. **Key/value pairs** — thêm ba mục:

   | Key                         | Value                   |
   | --------------------------- | ----------------------- |
   | `NUTRITRACK_API_KEY`        | `your_api_key_here`     |
   | `USDA_API_KEY`              | `your_usda_key_here`    |
   | `AVOCAVO_NUTRITION_API_KEY` | `your_avocavo_key_here` |

4. Nhấn **Next**
5. **Secret name:** `nutritrack/prod/api-keys`
6. **Tags** (tùy chọn): `Owner` = `your_name`
7. Nhấn **Next** → **Next** → **Store**
8. Ghi lại **Secret ARN** — định dạng: `arn:aws:secretsmanager:ap-southeast-2:<YOUR_ACCOUNT_ID>:secret:nutritrack/prod/api-keys-XXXXXX`

> **Quan trọng:** Sao chép toàn bộ Secret ARN (bao gồm hậu tố 6 ký tự cuối, ví dụ `-AbCdEf`). Bạn sẽ cần dùng nó trong phần `secrets` của task definition.

### Bước 8: Tạo IAM Roles

ECS cần **hai role riêng biệt** — nhiều người mới hay nhầm lẫn:

| Role                   | Được dùng bởi                 | Mục đích                                                                              |
| ---------------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| `ecsTaskExecutionRole` | ECS Agent (hệ thống)          | Pull image từ ECR, ghi logs vào CloudWatch, đọc secrets trước khi container khởi động |
| `ecsTaskRole`          | Code Python của bạn (runtime) | Gọi Bedrock, đọc/ghi S3, ghi CloudWatch logs — mọi thứ `boto3` cần                    |

**8.1 — Tạo `ecsTaskRole` (quyền runtime cho code)**

1. Vào **IAM Console** → **Roles** → **Create role**
2. **Trusted entity type:** AWS Service
3. **Use case:** Elastic Container Service → **Elastic Container Service Task**
4. Nhấn **Next**
5. **Gắn managed policies** — tìm và chọn ba policy:
   - `AmazonBedrockFullAccess` — cho phép container gọi Bedrock models
   - `AmazonS3FullAccess` — cho phép container đọc/ghi S3 cache bucket
   - `CloudWatchLogsFullAccess` — cho phép container ghi application logs
6. Nhấn **Next**
7. **Role name:** `ecsTaskRole`
8. Nhấn **Create role**

**8.2 — Tạo `ecsTaskExecutionRole` (quyền hệ thống cho ECS agent)**

1. Vào **IAM Console** → **Roles** → **Create role**
2. **Trusted entity type:** AWS Service
3. **Use case:** Elastic Container Service → **Elastic Container Service Task**
4. Nhấn **Next**
5. **Gắn managed policies** — tìm và chọn:
   - `AmazonECS_FullAccess`
   - `AmazonECSTaskExecutionRolePolicy` — bao gồm quyền pull ECR image và ghi CloudWatch logs
6. Nhấn **Next**
7. **Role name:** `ecsTaskExecutionRole`
8. Nhấn **Create role**

Sau khi tạo, thêm **inline policy** cho Secrets Manager:

1. Mở role `ecsTaskExecutionRole` → tab **Permissions** → **Add permissions** → **Create inline policy**
2. Chuyển sang tab **JSON**, dán:

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

> Thay `<YOUR_ACCOUNT_ID>` bằng AWS Account ID 12 chữ số của bạn (ví dụ `123456789012`).

3. **Policy name:** `NutriTrackSecretsAccess`
4. Nhấn **Create policy**

### Bước 9: Tạo ECS Cluster

1. Vào **ECS** → **Clusters** → **Create cluster**
2. Điền:
   - **Cluster name:** `nutritrack-api-cluster`
   - **Infrastructure:** tick **AWS Fargate (serverless)**
3. Nhấn **Create**

### Bước 10: Tạo Task Definition

1. **Task definitions** → **Create new task definition** → **Create new task definition with JSON**

2. Tải task definition production: [`v8.json`](task-definitions/v8.json)

Hoặc dán JSON sau (thay tất cả `<YOUR_ACCOUNT_ID>` và `<YOUR_S3_BUCKET_NAME>` bằng giá trị thực tế của bạn):

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

> **Cách tìm hậu tố Secret ARN:** Sau khi tạo secret ở Bước 7, mở **Secrets Manager Console** → nhấn vào secret → sao chép toàn bộ ARN hiển thị ở đầu trang. Hậu tố (ví dụ `-AbCdEf`) là 6 ký tự sau dấu gạch cuối.

> **Lưu ý cú pháp `secrets`:** Định dạng là `<secret-ARN>:<key-name>::` — hai dấu hai chấm cuối là bắt buộc. Thiếu chúng sẽ gây lỗi `ResourceInitializationError`.
>
> **Lưu ý `awslogs-create-group`:** Đặt `"true"` để tự động tạo CloudWatch log group `/ecs/arm-nutritrack-api-task` khi container khởi động lần đầu — không cần tạo thủ công.

### Bước 11: Tạo Security Groups

**ALB Security Group (`nutritrack-api-vpc-alb-sg`):**

1. EC2 Console → **Security Groups** → **Create security group**
2. **Name:** `nutritrack-api-vpc-alb-sg` | **VPC:** `nutritrack-api-vpc`
3. **Inbound rules:**

   | Type  | Port Range | Source      | Mô tả           |
   | ----- | ---------- | ----------- | --------------- |
   | HTTP  | 80         | `0.0.0.0/0` | HTTP công khai  |
   | HTTPS | 443        | `0.0.0.0/0` | HTTPS công khai |

4. **Outbound rules:**

   | Type       | Port Range | Destination                 | Mô tả                 |
   | ---------- | ---------- | --------------------------- | --------------------- |
   | HTTP       | 80         | `nutritrack-api-vpc-ecs-sg` | Forward đến ECS tasks |
   | HTTPS      | 443        | `nutritrack-api-vpc-ecs-sg` | Forward đến ECS tasks |
   | Custom TCP | 8000       | `nutritrack-api-vpc-ecs-sg` | Forward đến app port  |

5. Nhấn **Create security group**

**ECS Task Security Group (`nutritrack-api-vpc-ecs-sg`):**

1. Tạo thêm security group: `nutritrack-api-vpc-ecs-sg` | **VPC:** `nutritrack-api-vpc`
2. **Inbound rules:**

   | Type       | Port Range | Source                      | Mô tả           |
   | ---------- | ---------- | --------------------------- | --------------- |
   | HTTP       | 80         | `nutritrack-api-vpc-alb-sg` | Cho phép từ ALB |
   | HTTPS      | 443        | `nutritrack-api-vpc-alb-sg` | Cho phép từ ALB |
   | Custom TCP | 8000       | `nutritrack-api-vpc-alb-sg` | App port từ ALB |

3. **Outbound rules:**

   | Type  | Port Range | Destination | Mô tả                     |
   | ----- | ---------- | ----------- | ------------------------- |
   | HTTP  | 80         | `0.0.0.0/0` | Internet (VPC Endpoints)  |
   | HTTPS | 443        | `0.0.0.0/0` | Dịch vụ AWS qua endpoints |

4. Nhấn **Create security group**

> **Chuỗi Security Group:** Fargate tasks chỉ nhận kết nối từ SG của ALB. Dù ai biết được internal IP cũng không thể kết nối trực tiếp — phải đi qua ALB. Đây là lý do ta không bao giờ dùng dải IP làm source cho inbound rule của ECS SG.

**VPC Endpoints Security Group (`nutritrack-api-vpc-endpoints-sg`):**

1. Name: `nutritrack-api-vpc-endpoints-sg`
2. Inbound:
   - Type: HTTPS | Port: `443` | Source: `10.0.0.0/16` (toàn bộ VPC CIDR)
3. Outbound: All traffic

### Bước 12: Tạo 6 VPC Endpoints

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

> **Lưu ý chi phí:** Interface VPC Endpoints tốn \~$7.20/tháng mỗi endpoint mỗi AZ. Với 5 Interface endpoints × 2 AZs = \~$72/tháng cho endpoints + S3 Gateway (miễn phí). Vẫn rẻ hơn NAT Gateway (\~$32/tháng/AZ chỉ riêng gateway, chưa tính data transfer).

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

Auto Scaling tự động thêm/bớt tasks dựa trên CPU utilization. Chúng ta sẽ cấu hình hoàn toàn qua **AWS Console**.

**16.1 — Bật Auto Scaling qua Console**

1. Vào **ECS Console** → Cluster `nutritrack-api-cluster` → Service `spot-arm-nutritrack-api-task-service`
2. Nhấn **Update Service**
3. Cuộn đến **Service auto scaling** → mở rộng phần này
4. Tick **Use Service Auto Scaling**
5. Đặt:
   - **Minimum number of tasks:** `1`
   - **Maximum number of tasks:** `10`
6. Nhấn **Update**

**16.2 — Tạo Scale-Out Policy (CPU > 70% → thêm tasks)**

1. Sau khi update, quay lại service → tab **Auto Scaling** → **Add scaling policy**
2. Chọn **Target tracking**
3. Điền:
   - **Scaling policy name:** `nutritrack-api-cluster-scale-out`
   - **ECS service metric:** `ECSServiceAverageCPUUtilization`
   - **Target value:** `70`
   - **Scale-out cooldown period:** `120` giây
   - **Scale-in cooldown period:** `300` giây
4. Nhấn **Create**

> **Target Tracking** tự động tạo cả alarm scale-out và scale-in dựa trên giá trị CPU target. Khi CPU vượt 70% thì thêm tasks; khi giảm xuống dưới mức thấp thì bớt tasks — với cooldown phù hợp.

**16.3 — Xác nhận Auto Scaling Policy**

1. Vào **ECS Console** → Cluster → Service → tab **Auto Scaling**
2. Xác nhận policy `nutritrack-api-cluster-scale-out` được liệt kê với trạng thái **Active**
3. Vào **CloudWatch Console** → **Alarms** — hai alarm sẽ tự động được tạo:
   - `TargetTracking-...AlarmHigh` (kích hoạt scale-out)
   - `TargetTracking-...AlarmLow` (kích hoạt scale-in)

**16.4 — Giám sát Auto Scaling qua CloudWatch**

Target Tracking tự động tạo CloudWatch alarms cho bạn. Để xem và xác nhận:

1. Mở **CloudWatch Console** → **Alarms** → **All alarms**
2. Tìm hai alarms có tên bắt đầu bằng `TargetTracking-service/nutritrack-api-cluster/...`
   - `...AlarmHigh` — kích hoạt scale-out khi CPU vượt 70%
   - `...AlarmLow` — kích hoạt scale-in khi CPU giảm xuống mức thấp
3. Xác nhận cả hai alarms ở trạng thái **OK** khi không có traffic

**Cách Auto Scaling hoạt động:**

| Điều kiện           | Hành động              | Cooldown |
| ------------------- | ---------------------- | -------- |
| CPU > 70% kéo dài   | Thêm tasks (scale-out) | 120s     |
| CPU giảm xuống thấp | Bớt tasks (scale-in)   | 300s     |

> Target Tracking duy trì CPU mục tiêu ở 70%. Scale-out phản ứng nhanh (120s cooldown); scale-in thận trọng hơn (300s) để tránh xóa tasks trong giai đoạn traffic giảm tạm thời.

### Bước 17: Xác nhận Triển khai

**17.1 — Xác nhận qua AWS CLI:**

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

**17.2 — Xác nhận qua AWS Console:**

**Kiểm tra ECS Tasks:**

1. Vào **ECS Console** → Cluster `nutritrack-api-cluster` → tab **Tasks**
2. Xác nhận **2 tasks** với trạng thái **RUNNING** và **Last status** = `RUNNING`
3. Nhấn vào một task → kiểm tra phần **Container** → **Health status** phải là `HEALTHY`

**Kiểm tra CloudWatch Logs:**

1. Mở **CloudWatch Console** → **Log groups** → tìm `/ecs/arm-nutritrack-api-task`
2. Nhấn vào log group → tab **Log streams** → nhấn vào stream mới nhất
3. Xác nhận bạn thấy startup logs từ FastAPI (ví dụ: `Uvicorn running on 0.0.0.0:8000`)
4. Nếu log group chưa tồn tại, kiểm tra `awslogs-create-group` đã đặt `"true"` trong task definition

**Kiểm tra CloudWatch Alarms:**

1. **CloudWatch Console** → **Alarms** → **All alarms**
2. Tìm `nutritrack-api-cluster-cpu-above-70-alarm` — trạng thái phải là **OK** (CPU dưới 70%)
3. Tìm `nutritrack-api-cluster-cpu-below-20-alarm` — trạng thái có thể là **ALARM** nếu không có traffic (điều này bình thường, nó sẽ kích hoạt scale-in)

**Kiểm tra ECS Service Events:**

1. Vào **ECS Console** → Cluster → Service `spot-arm-nutritrack-api-task-service` → tab **Events**
2. Tìm các events như:
   - `service ... has reached a steady state` — triển khai thành công
   - `service ... registered 1 targets in target group ...` — tích hợp ALB hoạt động
3. Nếu bạn thấy error events như `task stopped: ResourceInitializationError`, kiểm tra VPC endpoints và IAM roles

> **Checkpoint:** 2 Fargate tasks đang chạy, ALB trả về `{"status": "healthy"}`, cả hai CloudWatch alarms đã cấu hình, logs hiển thị trong CloudWatch.

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

| Thành phần                                       | Chi phí/Tháng   |
| ------------------------------------------------ | --------------- |
| ECS Fargate Spot ARM (1 vCPU, 2GB, 2 tasks 24/7) | ~$20            |
| ALB (cố định + LCU)                              | ~$16-20         |
| VPC Interface Endpoints (×5 loại × 2 AZs)        | ~$72            |
| S3 Gateway Endpoint                              | Miễn phí        |
| ECR storage (~500 MB)                            | ~$0.05          |
| CloudWatch logs (lưu 14 ngày)                    | ~$0.50          |
| Secrets Manager                                  | ~$0.40          |
| **Tổng**                                         | **~$110/tháng** |

> **Tiết kiệm so với NAT Gateway:** NAT Gateway tốn $32/AZ/tháng + $0.045/GB data processed. Với 2 AZs thì $64+ trước data costs. VPC Endpoints thường rẻ hơn khi kết hợp với Fargate.

---

## Dọn dẹp

Để ngừng phát sinh chi phí, xóa tài nguyên **theo thứ tự** sau qua AWS Console:

**1. Giảm scale và xóa ECS Service**

1. Vào **ECS Console** → Cluster `nutritrack-api-cluster` → **Services** → chọn `spot-arm-nutritrack-api-task-service`
2. Nhấn **Update** → đặt **Desired tasks** thành `0` → nhấn **Update** (đợi tasks dừng ~1 phút)
3. Chọn lại service → **Delete** → xác nhận xóa

**2. Xóa ECS Cluster**

1. Vào **ECS Console** → **Clusters** → chọn `nutritrack-api-cluster`
2. Nhấn **Delete cluster** → xác nhận

**3. Xóa Auto Scaling Policy**

1. Trước khi xóa service, vào service → tab **Auto Scaling** → chọn policy → **Delete**
2. Các CloudWatch alarms liên quan sẽ tự động bị xóa

**4. Xóa Application Load Balancer**

1. Vào **EC2 Console** → **Load Balancers** → chọn `nutritrack-api-vpc-alb`
2. **Actions** → **Delete load balancer** → xác nhận

**5. Xóa Target Group**

1. **EC2 Console** → **Target Groups** → chọn `nutritrack-api-vpc-tg`
2. **Actions** → **Delete** → xác nhận

**6. Xóa VPC Endpoints (6 endpoints)**

1. Vào **VPC Console** → **Endpoints**
2. Chọn tất cả 6 endpoints (`nutritrack-api-vpc-bedrock-ep`, `nutritrack-api-vpc-api-ecr-ep`, `nutritrack-api-dkr-ecr-ep`, `nutritrack-api-vpc-s3-ep`, `nutritrack-api-vpc-sm-ep`, `nutritrack-api-vpc-cw-ep`)
3. **Actions** → **Delete VPC endpoints** → xác nhận

**7. Xóa ECR Repository**

1. Vào **Amazon ECR Console** → **Repositories**
2. Chọn `backend/nutritrack-api-image` → **Delete** → gõ `delete` để xác nhận

**8. Xóa Secrets Manager Secret**

1. Vào **Secrets Manager Console** → chọn `nutritrack/prod/api-keys`
2. **Actions** → **Delete secret**
3. Đặt **Waiting period** là `7 days` (tối thiểu) → **Schedule deletion**

**9. Làm trống và xóa S3 Bucket**

1. Vào **Amazon S3 Console** → chọn cache bucket của bạn (ví dụ `<YOUR_S3_BUCKET_NAME>`)
2. Nhấn **Empty** → gõ `permanently delete` → **Empty**
3. Sau khi làm trống, nhấn **Delete** → gõ tên bucket → **Delete bucket**

**10. Xóa VPC và tài nguyên mạng**

1. Vào **VPC Console** → **Security Groups** → xóa 3 SG tùy chỉnh (`alb-sg`, `ecs-sg`, `endpoints-sg`)
2. **VPC Console** → **Your VPCs** → chọn `nutritrack-api-vpc`
3. **Actions** → **Delete VPC** → AWS sẽ tự động xóa subnets, route tables và internet gateway liên quan → xác nhận

**11. Xóa IAM Roles**

1. Vào **IAM Console** → **Roles**
2. Tìm `ecsTaskRole` → chọn → **Delete** → xác nhận
3. Tìm `ecsTaskExecutionRole` → chọn → **Delete** → xác nhận

**12. Xóa CloudWatch Log Groups**

1. Vào **CloudWatch Console** → **Log groups**
2. Chọn `/ecs/arm-nutritrack-api-task` → **Actions** → **Delete log group(s)** → xác nhận

> **Checkpoint cuối:** ALB DNS trả HTTP 200, 2 Fargate tasks chạy trong private subnets, CloudWatch alarms đã cấu hình, Auto Scaling Min=1/Max=10 đã cấu hình.