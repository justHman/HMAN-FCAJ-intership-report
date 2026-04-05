## Điều Kiện Tiên Quyết

Trước khi bắt đầu workshop, hãy đảm bảo bạn đã chuẩn bị đầy đủ các công cụ và tài khoản sau.

#### Tài khoản AWS

- Một **tài khoản AWS** đang hoạt động với quyền administrator
- AWS CLI v2 đã cài đặt và cấu hình credentials:

```bash
aws configure
# Nhập Access Key ID, Secret Access Key, và default region (ap-southeast-2)
```

- Xác nhận cấu hình:

```bash
aws sts get-caller-identity
```

#### Node.js & Trình quản lý Package

- **Node.js 18.x trở lên** (khuyến nghị bản LTS)
- **npm 9.x trở lên**

```bash
node --version   # Kết quả phải là v18.x.x trở lên
npm --version    # Kết quả phải là 9.x.x trở lên
```

#### AWS Amplify CLI

- Cài đặt Amplify Gen 2 CLI:

```bash
npm install -g @aws-amplify/backend-cli
```

- Xác nhận cài đặt:

```bash
npx ampx --version
```

#### React Native / Expo

- **Expo CLI** cho phát triển di động:

```bash
npm install -g expo-cli
```

- **Android Studio** (cho Android emulator) hoặc thiết bị thật có cài ứng dụng **Expo Go**
- Cho phát triển iOS: macOS với **Xcode 14+** (tùy chọn, chiến lược Android-first)

#### Git

- **Git** cho quản lý phiên bản:

```bash
git --version   # Kết quả phải là 2.x trở lên
```

#### Công cụ Phát triển

- **VS Code** (IDE khuyến nghị) với các extension:
  - AWS Toolkit
  - TypeScript / JavaScript
  - React Native Tools
  - GraphQL syntax highlighting

#### Docker (cho phần ECS Fargate)

- **Docker Desktop** đã cài đặt và đang chạy:

```bash
docker --version   # Kết quả phải là 20.x trở lên
```

#### Cân nhắc Chi phí

> ⚠️ **Quan trọng:** Workshop này sử dụng các dịch vụ AWS có phí. Phần lớn dịch vụ có Free Tier, nhưng lệnh gọi **Amazon Bedrock** (Qwen3-VL) AI sẽ phát sinh phí dựa trên lượng token. Chi phí workshop ước tính: **$2-5 USD**. Hãy thiết lập **billing alarm** trước khi tiếp tục:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "WorkshopBudgetAlert" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT:billing-alarm
```

#### Chọn Region

Workshop sử dụng region **Asia Pacific (Sydney) — ap-southeast-2**, vì region này hỗ trợ Amazon Bedrock với Qwen3-VL. Đảm bảo tạo tất cả tài nguyên AWS trong region này.

#### Danh sách Kiểm tra

Trước khi tiếp tục, xác nhận:

- [ ] Tài khoản AWS với quyền admin đã kích hoạt
- [ ] AWS CLI đã cấu hình với `ap-southeast-2` làm region mặc định
- [ ] Node.js 18+ và npm đã cài đặt
- [ ] Amplify CLI đã cài đặt (`npx ampx --version`)
- [ ] Expo CLI đã cài đặt, ứng dụng Expo Go trên thiết bị hoặc emulator sẵn sàng
- [ ] Git đã cài đặt
- [ ] Docker Desktop đã cài đặt (cho Giai đoạn 6)
- [ ] Billing alarm đã cấu hình