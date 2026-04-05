## Giai đoạn 7: CI/CD & Triển Khai Đa Môi Trường

Trong giai đoạn này, bạn sẽ cấu hình pipeline CI/CD Amplify Hosting cho triển khai tự động trên 3 môi trường, và thiết lập `amplify.yml` build specification.

#### Chiến lược Đa Môi Trường

NutriTrack sử dụng mô hình triển khai dựa trên branch với AWS Amplify:

| Môi trường | Branch | Lambda Prefix | Mục đích |
|------------|--------|---------------|----------|
| **Sandbox** | Local (`npx ampx sandbox`) | `amplify-nutritrack-tdtp2--` | Phát triển & kiểm thử cá nhân |
| **Staging** | `feat/phase3-frontend-integration` | `amplify-d1glc6vvop0xlb-fe-` | Kiểm thử tích hợp tính năng |
| **Production** | `main` | `amplify-d1glc6vvop0xlb-ma-` | Triển khai cho người dùng thực |

Mỗi môi trường có riêng:
- Bảng DynamoDB (dữ liệu cách ly)
- S3 bucket (lưu trữ media riêng)
- Cognito User Pool (cơ sở người dùng độc lập)
- Lambda functions (cấu hình theo môi trường)
- `amplify_outputs.json` (tự động tạo cho từng môi trường)

#### Bước 1: Cấu hình amplify.yml

Tạo `amplify.yml` ở gốc dự án:

```yaml
version: 1
backend:
  phases:
    preBuild:
      commands:
        - cd backend
        - npm ci
        - cd amplify/ai-engine && npm ci && cd ../..
        - cd amplify/process-nutrition && npm ci && cd ../..
        - cd amplify/friend-request && npm ci && cd ../..
        - cd amplify/resize-image && npm ci && cd ../..
    build:
      commands:
        - cd backend
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
        - npx ampx generate outputs --branch $AWS_BRANCH --app-id $AWS_APP_ID --out-dir ../frontend

frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci --legacy-peer-deps
    build:
      commands:
        - cd frontend
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
```

#### Bước 2: Kết nối Repository với Amplify Hosting

1. Vào **AWS Amplify Console** → **New App** → **Host web app**
2. Kết nối GitHub repository
3. Chọn branch `main` cho production
4. Amplify tự nhận diện `amplify.yml` và cấu hình pipeline

#### Bước 3: Thêm Branch Deployments

Mỗi khi push lên branch đã kết nối → trigger triển khai đầy đủ tự động.

#### Luồng Triển khai

```
Developer push lên branch
    ↓
Amplify phát hiện push (webhook)
    ↓
Backend Phase: Cài deps → Deploy CDK stack
    ↓
Generate amplify_outputs.json cho branch
    ↓
Frontend Phase: Cài deps → Build → Deploy lên CloudFront
    ↓
✅ URL live tại https://branch.d1glc6vvop0xlb.amplifyapp.com
```

#### Xác nhận

1. Push commit lên `main` → Xác nhận Amplify trigger build
2. Kiểm tra build logs trong Amplify Console
3. Xác nhận URL đã triển khai load ứng dụng đúng
4. Test mỗi môi trường có dữ liệu cách ly (bảng DynamoDB khác nhau)

> 🎯 **Checkpoint:** Push lên bất kỳ branch đã kết nối trigger triển khai tự động. Mỗi môi trường có tài nguyên và dữ liệu cách ly.