## NutriTrack — Tổng Quan Kiến Trúc

#### Thành phần Hệ thống

**NutriTrack** là nền tảng theo dõi dinh dưỡng full-stack, tích hợp AI, xây dựng trên kiến trúc serverless AWS. Hệ thống sử dụng **React Native (Expo)** cho frontend di động đa nền tảng và **AWS Amplify Gen 2** để điều phối toàn bộ hạ tầng backend, bao gồm xác thực, API, lưu trữ và tính toán.

Lõi AI engine tận dụng **Amazon Bedrock** với mô hình vision-language **Qwen3-VL 235B** để phân tích ảnh đồ ăn, quét nhãn dinh dưỡng, và tạo ra thông tin dinh dưỡng cá nhân hóa — tất cả trong thời gian thực.

#### Sơ đồ Kiến trúc

![Kiến trúc Giải pháp NutriTrack](/hei-FCAJ-intership-report/solution-architect/nutritrack-solution-architect.drawio.png)

*Kiến trúc Giải pháp AWS NutriTrack — Triển khai full-stack serverless*

#### Các Tầng Kiến trúc

Nền tảng được tổ chức thành **7 tầng riêng biệt**:

1. **Tầng Bảo mật Biên (Edge & Security)**
   - **Route 53** — Định tuyến DNS và quản lý tên miền
   - **AWS WAF** — Tường lửa ứng dụng web chống DDoS và lọc request
   - **Amazon CloudFront** — CDN phân phối nội dung toàn cầu

2. **Tầng Xác thực (Amplify Managed)**
   - **Amazon Cognito** — User pools với xác nhận email/OTP
   - **Google OAuth2** — Đăng nhập xã hội federation
   - Xác thực sinh trắc học (FaceID/TouchID) trên thiết bị

3. **Tầng API**
   - **AWS AppSync (GraphQL)** — GraphQL managed với real-time subscriptions, tự động xử lý xung đột, và phân quyền chi tiết

4. **Tầng Xử lý (Lambda)**
   - `aiEngine` — Bộ xử lý AI đa tác vụ (10 actions: analyzeFoodImage, voiceToFood, generateRecipe, generateCoachResponse, searchFoodNutrition, fixFood, ollieCoachTip, calculateMacros, challengeSummary, weeklyInsight)
   - `processFood` / `processNutrition` — Tra cứu thực phẩm lai ghép (DynamoDB fuzzy match → Bedrock AI dự phòng)
   - `friendRequest` — Hệ thống xã hội (gửi/chấp nhận/từ chối/chặn) dùng DynamoDB TransactWriteItems
   - `resizeImage` — S3 event trigger, resize về 1024px WebP chất lượng 80% dùng `sharp`

5. **Dịch vụ AI/ML**
   - **Amazon Bedrock** — Qwen3-VL 235B cho phân tích ảnh và tạo dữ liệu dinh dưỡng
   - **AWS Transcribe** — Chuyển giọng nói sang văn bản cho ghi nhật ký bằng giọng nói
   - **AWS Textract** — OCR cho quét nhãn dinh dưỡng

6. **Tầng Lưu trữ & Dữ liệu**
   - **Amazon S3** — 3 prefix: `incoming/` (upload gốc, xóa sau 1 ngày), `voice/` (ghi âm), `media/` (đã xử lý)
   - **Amazon DynamoDB** — 8 bảng: `user`, `Food`, `FoodLog`, `FridgeItem`, `Challenge`, `ChallengeParticipant`, `Friendship`, `UserPublicStats`

7. **Tầng Container (ECS Fargate)**
   - **VPC** với public/private subnets trên 2 AZ (ap-southeast-2a)
   - **ECS Fargate** chạy container FastAPI backend
   - **ALB** (Application Load Balancer) phân phối traffic
   - **Auto Scaling** co giãn container theo nhu cầu
   - **ECR** lưu trữ Docker images
   - **VPC Endpoints** truy cập dịch vụ AWS an toàn

#### Mục tiêu Workshop

Sau khi hoàn thành workshop, bạn sẽ:

- ✅ Cấu hình **AWS Amplify Gen 2** với TypeScript CDK backend
- ✅ Thiết lập xác thực **Amazon Cognito** + Google OAuth2
- ✅ Thiết kế và triển khai **8 model DynamoDB** thông qua AppSync GraphQL
- ✅ Xây dựng **4 Lambda functions** bao gồm AI engine tích hợp Bedrock
- ✅ Cấu hình **S3 storage** với lifecycle rules và event triggers
- ✅ Xây dựng ứng dụng di động **React Native/Expo** hỗ trợ song ngữ
- ✅ Triển khai **container FastAPI** trên ECS Fargate với ALB và Auto Scaling
- ✅ Thiết lập **CI/CD pipelines** với Amplify Hosting trên 3 environments
- ✅ Triển khai **monitoring** với CloudWatch custom metrics và alarms

#### Thời gian Ước tính

| Phần | Thời lượng |
|------|------------|
| Điều kiện tiên quyết & Thiết lập | 30 phút |
| Amplify Gen 2 + Auth | 45 phút |
| Tầng Dữ liệu (DynamoDB) | 45 phút |
| Lambda Functions & AI | 60 phút |
| AppSync & Tính năng Xã hội | 30 phút |
| Frontend React Native | 90 phút |
| Triển khai ECS Fargate | 60 phút |
| CI/CD & Testing | 30 phút |
| **Tổng cộng** | **~6.5 giờ** |

#### Chi phí Ước tính

Chạy workshop này với tất cả tài nguyên hoạt động để kiểm thử sẽ tốn khoảng **$2-5 USD**. Hãy dọn dẹp tất cả tài nguyên sau khi hoàn thành để tránh phí phát sinh. Chi phí production hàng tháng cho 1.000 người dùng ước tính **$60.87/tháng** (xem phần Proposal để biết chi tiết).
