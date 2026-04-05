## Dọn Dẹp

Sau khi hoàn thành workshop, thực hiện các bước sau để xóa tất cả tài nguyên AWS và tránh phí phát sinh.

#### Cách 1: Dọn dẹp Amplify Sandbox (Phát triển)

Nếu bạn dùng Amplify Sandbox cho phát triển local:

```bash
cd backend
npx ampx sandbox delete
```

Lệnh này xóa: tất cả bảng DynamoDB, S3 bucket, Lambda functions, Cognito User Pool, AppSync API, IAM roles và policies.

#### Cách 2: Dọn dẹp Amplify Hosted App (Production)

Cho môi trường đã triển khai theo branch:

1. Vào **AWS Amplify Console**
2. Chọn app → **App settings** → **General**
3. Click **Delete app** để xóa tất cả

#### Cách 3: Dọn dẹp Thủ công (Từng tài nguyên)

**ECS Fargate:**
```bash
aws ecs update-service --cluster nutritrack --service nutritrack-api --desired-count 0
aws ecs delete-service --cluster nutritrack --service nutritrack-api
aws ecr delete-repository --repository-name nutritrack-api --force
```

**S3 Bucket:**
```bash
aws s3 rb s3://YOUR-BUCKET-NAME --force
```

**DynamoDB (8 bảng):**
```bash
aws dynamodb delete-table --table-name user-SUFFIX
aws dynamodb delete-table --table-name Food-SUFFIX
# ... 6 bảng còn lại
```

#### Danh sách Kiểm tra Sau Dọn dẹp

- [ ] **DynamoDB** — Không còn bảng workshop
- [ ] **Lambda** — Không còn functions workshop
- [ ] **S3** — Không còn buckets workshop
- [ ] **Cognito** — Không còn user pools workshop
- [ ] **ECS** — Clusters, services đã xóa
- [ ] **CloudWatch** — Alarms và log groups đã xóa
- [ ] **Billing** — Kiểm tra AWS Cost Explorer

> ⚠️ **Quan trọng:** Luôn xác nhận dọn dẹp qua AWS Console. Một số tài nguyên có thể còn sót.

- [5.10.1 Dọn Dẹp Thủ Công](5.10.1-manual/) — Xóa từng tài nguyên chi tiết
- [5.10.2 Dọn Dẹp CLI](5.10.2-cdk/) — Dọn dẹp tự động qua Amplify CLI