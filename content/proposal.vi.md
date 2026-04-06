# Nền tảng NutriTrack

## Giải pháp AWS Serverless toàn diện cho Theo dõi Dinh dưỡng tích hợp AI

### 1. Tóm tắt Dự án (Executive Summary)

Nền tảng NutriTrack được thiết kế dành cho đối tượng Gen Z và Millennials Việt Nam, nhằm nâng cao khả năng quản lý sức khỏe cá nhân và theo dõi dữ liệu dinh dưỡng hàng ngày. Nền tảng hướng đến quy mô 1.000+ người dùng hoạt động, sử dụng giao diện di động đa nền tảng xây dựng bằng React Native (Expo) để thu thập và phân tích dữ liệu chế độ ăn uống thông qua ảnh chụp, ghi âm giọng nói, và nhập liệu thủ công. Bám sát các nguyên tắc của AWS Well-Architected Framework, nền tảng tận dụng tối đa hệ sinh thái AWS Serverless (AWS Amplify Gen 2, AppSync, Lambda) và Generative AI (Amazon Bedrock dòng Qwen3-VL 235B) nhằm mang đến hệ thống theo dõi dinh dưỡng thời gian thực, ghi nhật ký bằng AI dự đoán, cơ chế gamification (chuỗi ngày liên tục, tiến hóa thú cưng ảo, thử thách cộng đồng) và tối ưu chi phí — tất cả được bảo mật toàn diện bởi Amazon Cognito kết hợp Google OAuth2.

### 2. Tuyên bố Vấn đề (Problem Statement)

**Vấn đề là gì?**

Các ứng dụng theo dõi dinh dưỡng hiện tại đòi hỏi người dùng phải nhập liệu thủ công một cách tẻ nhạt và thường thiếu các cơ sở dữ liệu món ăn Việt Nam cá nhân hóa, phong phú. Hơn nữa, người dùng thường gặp rắc rối trong việc lên thực đơn hàng ngày và quản lý thực phẩm dự trữ trong nhà, dễ dẫn đến lãng phí thức ăn và thói quen ăn uống không nhất quán. Chưa có một hệ thống thông minh, tập trung nào tích hợp AI theo thời gian thực để tự động tạo ra hồ sơ món ăn bị thiếu hay gợi ý công thức nấu ăn từ nguyên liệu sẵn có, trong khi những API của bên thứ ba (như Nutritionix hay FatSecret) thường đắt đỏ khi mở rộng quy mô và hạn chế trong mô hình dữ liệu — đặc biệt đối với các món ăn đặc trưng vùng miền như phở, bánh mì, hay bún bò Huế.

**Giải pháp**

NutriTrack giải quyết những bất cập trên bằng kiến trúc AWS-native hoàn toàn serverless:

- **AWS AppSync (GraphQL)** tiếp nhận dữ liệu ăn uống của người dùng thông qua mutations và subscriptions thời gian thực.
- **AWS Lambda** (4 hàm chuyên biệt) xử lý toàn bộ logic backend — từ điều phối AI đến quản lý hệ thống bạn bè đến xử lý hình ảnh.
- **Amazon DynamoDB** lưu trữ 8 mô hình dữ liệu (hồ sơ người dùng, nhật ký bữa ăn, thử thách, v.v.) với khả năng co giãn tự động.
- **Amazon Bedrock** (model Qwen3-VL 235B) cung cấp sức mạnh cho luồng AI — phân tích ảnh đồ ăn, quét mã vạch/nhãn, và tạo dữ liệu dinh dưỡng bị thiếu ngay lập tức.
- **AWS Amplify Gen 2** kết hợp React Native/Expo cung cấp giao diện song ngữ tinh tế (Tiếng Việt/Tiếng Anh).

Các tính năng chính bao gồm:

- **Phân tích Đồ ăn bằng AI** — Chụp một tấm ảnh, nhận ngay bảng phân tích dinh dưỡng chi tiết
- **Ghi nhật ký bằng Giọng nói** — Nói tên món ăn, AWS Transcribe tự động chuyển đổi
- **Quản lý Tủ lạnh/Nhà bếp Thông minh** — Theo dõi thực phẩm, nhận gợi ý công thức nấu ăn từ AI
- **Huấn luyện viên AI "Ollie"** — Mẹo dinh dưỡng cá nhân hóa và phân tích tuần
- **Gamification** — Chuỗi ngày liên tục, thú cưng ảo tiến hóa, thử thách cộng đồng
- **Tính năng Xã hội** — Hệ thống kết bạn với bảng xếp hạng và thử thách đối kháng

**Lợi ích và Tỷ suất Hoàn vốn (ROI)**

Giải pháp thiết lập một hệ sinh thái nền tảng gốc rễ giúp người dùng theo dõi sức khỏe và giúp đội ngũ phát triển mở rộng quy mô ứng dụng sức khỏe tích hợp AI. Nó giảm thiểu đáng kể rào cản nhập liệu thủ công nhờ luồng AI, đơn giản hóa trải nghiệm người dùng và cải thiện độ tin cậy dữ liệu. Chi phí vận hành hàng tháng được giữ ở mức xấp xỉ **$60.87/tháng ($730.44/năm)** cho 1.000 người dùng nhờ tận dụng tối đa hạng mức AWS Free Tier và mô hình serverless trả-theo-sử-dụng. Mốc hòa vốn sẽ đạt được khi doanh thu từ gói đăng ký premium (phân tích ảnh không giới hạn, báo cáo AI tuần chuyên sâu, huấn luyện viên AI ưu tiên) đủ bù chi phí vận hành — tỉ lệ chuyển đổi và mức giá chính thức sẽ được xác thực trong giai đoạn hậu ra mắt.

### 3. Kiến trúc Giải pháp

Nền tảng sử dụng kiến trúc AWS serverless đa tầng để quản lý dữ liệu người dùng và các phản hồi AI một cách mượt mà. Dòng dữ liệu chảy từ ứng dụng di động React Native qua CloudFront/WAF để bảo mật biên, vào AppSync GraphQL API, được xử lý bởi các hàm Lambda chuyên biệt, lưu trữ trong DynamoDB, và làm phong phú bằng các mô hình AI Bedrock. Toàn bộ backend được điều phối bởi AWS Amplify Gen 2 với quy trình CI/CD tự động trên 3 môi trường.

#### Kiến trúc Nền tảng NutriTrack

![Kiến trúc Giải pháp NutriTrack](solution-architect/nutritrack-api-vpc.drawio.png)

**Các dịch vụ AWS được sử dụng**

| Dịch vụ | Vai trò |
|---------|---------|
| **AWS Amplify Gen 2** | Điều phối hạ tầng backend dưới dạng mã (TypeScript CDK), pipeline CI/CD, và quản lý 3 môi trường triển khai (Sandbox, feat/phase3, main). |
| **AWS AppSync** | Hỗ trợ giao tiếp GraphQL API bảo mật giữa ứng dụng React Native và các Lambda resolver backend, với real-time subscriptions. |
| **AWS Lambda** | Xử lý logic nghiệp vụ qua 4 hàm chuyên biệt: `ai-engine` (10 tác vụ AI), `process-nutrition` (tra cứu thực phẩm lai ghép), `friend-request` (tính năng xã hội), và `resize-image` (tối ưu ảnh từ S3 trigger). |
| **Amazon DynamoDB** | Lưu trữ toàn bộ dữ liệu ứng dụng trên 8 bảng NoSQL: `user`, `Food` (~200 món Việt), `FoodLog`, `FridgeItem`, `Challenge`, `ChallengeParticipant`, `Friendship`, `UserPublicStats`. |
| **Amazon Bedrock** | Vận hành tính năng AI sử dụng Qwen3-VL 235B (ap-southeast-2) cho phân tích ảnh, quét mã vạch, đọc nhãn dinh dưỡng, gợi ý công thức, và huấn luyện viên AI thông qua prompt templates nhúng sẵn. |
| **AWS Transcribe** | Chuyển đổi bản ghi âm (lưu trong S3 prefix `/voice`) sang văn bản để hỗ trợ ghi nhật ký bữa ăn bằng giọng nói. |
| **Amazon S3** | Lưu trữ media người dùng theo 4 prefix có tổ chức: `incoming/{entity_id}/*` (ảnh gốc upload, tự xóa sau 1 ngày bởi lifecycle rule), `voice/*` (file ghi âm ephemeral cho Transcribe), `avatar/{entity_id}/*` (ảnh đại diện, write scoped theo identity), `media/{entity_id}/*` (tài nguyên đã xử lý do `resizeImage` ghi). |
| **Amazon Cognito** | Bảo mật quyền truy cập bằng email/OTP và Google OAuth2, quản lý JWT tokens và user pools. |
| **Amazon CloudFront** | CDN biên giúp tăng tốc phân phối nội dung tới người dùng cuối. |
| **AWS WAF** | Tường lửa ứng dụng web bảo vệ API khỏi các cuộc tấn công phổ biến và DDoS. |
| **Route 53** | Định tuyến DNS cho domain ứng dụng. |
| **Amazon ECR** | Kho chứa container cho các image Docker của ECS Fargate. |
| **Amazon ECS Fargate** | Điều phối container serverless cho backend FastAPI, chạy trong VPC với private subnets trên 2 AZ, kèm ALB và Auto Scaling. |
| **AWS CloudWatch** | Giám sát với các metrics tùy chỉnh (Bedrock_AI_Error_Rate, Image_Processing_Time, User_Daily_Active, Food_Log_Count). |
| **AWS CloudTrail** | Ghi log hoạt động API phục vụ kiểm toán và tuân thủ. |
| **AWS KMS** | Quản lý khóa mã hóa cho dữ liệu nhạy cảm khi lưu trữ. |
| **AWS Secrets Manager** | Bảo mật lưu trữ API keys, JWT master keys và cấu hình ứng dụng. |
| **AWS Textract** | Khả năng OCR để quét và trích xuất văn bản từ nhãn dinh dưỡng. |

**Thiết kế Thành phần**

- **Thiết bị Khách (Client Devices):** Ứng dụng di động React Native/Expo thu thập đầu vào qua Camera (chụp ảnh đồ ăn, quét mã vạch/nhãn), Microphone (ghi âm bữa ăn), và nhập liệu thủ công. Ứng dụng trực quan hóa dữ liệu dinh dưỡng bằng biểu đồ tương tác và giao diện gamification với thú cưng ảo tiến hóa dựa trên chuỗi ngày liên tục.
- **Bảo mật Biên:** Route 53 → WAF → CloudFront cung cấp phân giải DNS, bảo vệ DDoS, và tăng tốc nội dung toàn cầu trước khi request đến backend.
- **Xác thực:** Amazon Cognito quản lý đăng ký (email/OTP), đăng nhập xã hội Google OAuth2, và quản lý JWT token. Ứng dụng bổ sung bảo mật sinh trắc học cục bộ (FaceID/TouchID) như lớp bảo vệ thứ hai.
- **Tiếp nhận Dữ liệu:** AppSync nhận GraphQL mutations/queries từ ứng dụng di động, định tuyến đến Lambda resolver tương ứng.
- **Tầng Xử lý:** 4 hàm Lambda xử lý toàn bộ logic:
  - `aiEngine` — Điều phối 10 tác vụ AI (analyzeFoodImage, voiceToFood, generateRecipe, generateCoachResponse, searchFoodNutrition, fixFood, ollieCoachTip, calculateMacros, challengeSummary, weeklyInsight)
  - `processNutrition` — Tra cứu lai ghép: khớp fuzzy DynamoDB (~200 món Việt) trước, dự phòng Bedrock AI nếu không tìm thấy
  - `friendRequest` — Tính năng xã hội: gửi/chấp nhận/từ chối/chặn bằng DynamoDB TransactWriteItems
  - `resizeImage` — S3 event trigger trên prefix `incoming/`, dùng thư viện `sharp` scale cạnh dài nhất về 1280px (giữ nguyên tỉ lệ, tự xoay theo EXIF) và encode lại thành progressive JPEG chất lượng 85; bản đã resize được ghi vào `media/{entity_id}/`, bản gốc vẫn nằm ở `incoming/` cho tới khi lifecycle rule xóa sau 1 ngày
- **Tầng Dữ liệu:** 8 bảng DynamoDB với phân quyền theo chủ sở hữu (owner-scoped) và tối ưu GSI.
- **Dịch vụ AI/ML:** Bedrock (Qwen3-VL 235B) + Transcribe cung cấp lớp trí tuệ cốt lõi, với tất cả lệnh gọi AI được định tuyến qua Lambda `aiEngine` cùng prompt templates có cấu trúc.
- **Tầng Container:** ECS Fargate chạy backend FastAPI tự lưu trữ trong VPC trên 2 AZ (ap-southeast-2a) với private subnets, cân bằng tải ALB, Auto Scaling, và VPC Endpoints để truy cập dịch vụ AWS an toàn.

### 4. Triển khai Kỹ thuật

**Các Giai đoạn Triển khai**

Dự án tuân theo 4 giai đoạn:

1. **Giai đoạn Tiền kỳ — Lý thuyết & Kiến trúc (Tháng 0):** Nghiên cứu React Native/Expo với AWS Amplify Gen 2 và thiết kế kiến trúc serverless tích hợp AI Bedrock. Phác thảo sơ đồ kiến trúc giải pháp và định nghĩa mô hình dữ liệu.
2. **Giai đoạn 1 — Chi phí & Khả thi (Tháng 1):** Dùng AWS Pricing Calculator ước tính chi phí (gọi Lambda, token Bedrock, dung lượng DynamoDB) cho 1.000 người dùng, xác nhận ngưỡng dưới $65/tháng. Thiết lập Amplify Gen 2 sandbox, Cognito + Google federation, và schema GraphQL 8 model.
3. **Giai đoạn 2 — Phát triển Cốt lõi (Tháng 2):** Triển khai 4 Lambda handler TypeScript (`aiEngine`, `processNutrition`, `friendRequest`, `resizeImage`), nối AppSync resolver, xây dựng UI React Native cho 6 tab chính, và tích hợp pipeline upload + resize ảnh qua S3.
4. **Giai đoạn 3 — Tích hợp, Kiểm thử & Ra mắt (Tháng 3):** Tích hợp đầy đủ Bedrock (Qwen3-VL) với 10 tác vụ AI, kiểm thử E2E trên 3 môi trường (Sandbox / `feat/phase3` / `main`), xử lý các lỗi biên (JWT federation, mơ hồ `discoverTables()`, `NoValidAuthTokens`), và ra mắt production.
5. **Hậu Ra mắt — Tinh chỉnh & Tối ưu (Liên tục):** Đánh giá UX/UI từ phản hồi người dùng, cải thiện gamification (tiến hóa thú cưng, cơ chế thử thách), tối ưu prompt engineering, và phát triển gói premium.

**Yêu cầu Kỹ thuật**

- **Frontend:** React Native, Expo, TypeScript, Zustand (quản lý trạng thái), react-native-reanimated (animations), expo-router (routing theo cấu trúc file), i18n (hỗ trợ song ngữ Tiếng Việt/Tiếng Anh).
- **Backend:** AWS Amplify Gen 2 (TypeScript CDK), Lambda (Node.js 22 — khai báo qua `runtime: 22` trong `defineFunction`), AppSync (GraphQL), DynamoDB (8 bảng với GSI), Cognito (User Pools + Identity Pools kèm Google federation), S3 (4 prefix, lifecycle rule trên `incoming/`).
- **Tích hợp AI:** Amazon Bedrock API (Qwen3-VL 235B, region ap-southeast-2), AWS Transcribe (async transcription jobs), embedded prompt engineering với JSON schema enforcement. 10 tác vụ AI được điều phối qua Lambda `aiEngine` duy nhất.
- **Hạ tầng:** Docker/ECS Fargate cho backend FastAPI, VPC với public/private subnets, ALB, Auto Scaling, ECR cho container images.

### 5. Lịch trình & Cột mốc

**Lịch trình Dự án**

| Giai đoạn | Thời lượng | Chi tiết |
|-----------|------------|----------|
| **Giai đoạn Tiền kỳ (Tháng 0)** | 1 tháng | Lập kế hoạch UI/UX trên Figma, rà soát tài liệu phiên bản cũ (chuyển từ Flutter sang React Native), thiết kế kiến trúc trên draw.io, và đánh giá các dịch vụ AWS. |
| **Giai đoạn 1 (Tháng 1)** | 1 tháng | Khởi tạo môi trường AWS Amplify Gen 2, cấu hình Cognito auth + Google OAuth, định nghĩa 8 model DynamoDB qua `data/resource.ts`, và xây dựng các component UI React Native cốt lõi (Home, Add Food, Kitchen tabs). |
| **Giai đoạn 2 (Tháng 2)** | 1 tháng | Kết nối API AppSync GraphQL, triển khai Lambda `processNutrition` và `friendRequest`, xây dựng giao diện Tủ lạnh/Nhà bếp, và tích hợp pipeline upload ảnh S3 với trigger `resizeImage`. |
| **Giai đoạn 3 (Tháng 3)** | 1 tháng | Triển khai Lambda `aiEngine` với 10 tác vụ Bedrock (Qwen3-VL), xây dựng hệ thống gamification (streaks, thú cưng tiến hóa, thử thách), thực hiện E2E testing trên 3 môi trường (Sandbox / `feat/phase3` / `main`), sửa lỗi JWT + `discoverTables()`, và ra mắt production. |
| **Hậu Ra mắt** | Liên tục | Tối ưu hiệu suất, tích hợp phản hồi người dùng, pipeline iOS EAS Build, và mở rộng quy mô người dùng trong 1 năm. |

### 6. Ước tính Ngân sách

Ngân sách được tính cho **1.000 người dùng hoạt động thực hiện 3 phiên/ngày trong 30 ngày** (tổng cộng 90.000 tương tác AI/tháng). Chi tiết đầy đủ có trong [Tệp Ước tính Ngân sách (budget2.0.xlsx)](/budget2.0.xlsx).

**Chi phí Hạ tầng (Ước lượng Hàng tháng)**

| Thành phần | Ước tính Chi phí | Ghi chú |
|------------|------------------|---------|
| **Amazon S3** | $2.03/tháng | 3GB lưu trữ ($0.075) + 5GB transfer out ($0.60) + PUT/GET requests ($1.35) |
| **AWS Lambda** | $0.26/tháng | 270K requests ($0.054) + thời gian tính toán ($0.205) — trung bình 0.2s, 512MB ARM64 |
| **AppSync GraphQL** | $0.34/tháng | 270K query/mutation operations với giá $4/triệu (kiến trúc production dùng AppSync, không phải REST API Gateway — xem §3) |
| **Amazon DynamoDB** | $0.47/tháng | 2GB lưu trữ ($0.228) + 810K reads ($0.115) + 180K writes ($0.128) |
| **Amazon Cognito** | $5.50/tháng | 1.000 MAU trên gói Lite với giá $0.0055/MAU |
| **CloudWatch** | $1.00/tháng | 5 custom metrics + API request logging |
| **CloudTrail** | $0.05/tháng | 50.000 management events |
| **Secrets Manager** | $1.20/tháng | 3 secrets (API keys, JWT master key, cấu hình DB) |
| **AWS KMS** | $1.00/tháng | 1 customer-managed encryption key |
| **AWS Textract** | $3.60/tháng | 2.400 lần quét nhãn (400 users × 6 nhãn/tháng) với giá $0.0015/trang |
| **Amazon Bedrock (AI)** | **$45.42/tháng** | 90K lệnh gọi AI: input tokens ($16.70) + output tokens ($28.73) — Giá Standard Qwen3-VL (US East) |
| **Tổng Ước lượng** | **$60.87/tháng** | **$730.44/12 tháng** |

**Chi tiết Giá Bedrock AI (Qwen3-VL 235B)**

| Khu vực | Input (Standard) | Output (Standard) | So với US |
|---------|------------------|-------------------|-----------|
| US East (Virginia) | $0.00053/1K tokens | $0.00266/1K tokens | Baseline |
| Asia Pacific (Tokyo) | $0.00064/1K tokens | $0.00322/1K tokens | +21% |
| Asia Pacific (Mumbai) | $0.00062/1K tokens | $0.00313/1K tokens | +18% |
| Asia Pacific (Sydney) | Dùng cho production | Dùng cho production | ap-southeast-2 |

**Chi phí Phần mềm/Bản quyền:** $0 — Tất cả công cụ phát triển đều mã nguồn mở (VS Code, Expo, Node.js). Tài khoản Apple Developer ($99/năm) cần thiết cho phân phối iOS.

### 7. Đánh giá Rủi ro

**Ma trận Rủi ro**

| Rủi ro | Tác động | Xác suất | Giảm thiểu |
|--------|----------|----------|------------|
| **Vượt chi phí (Bedrock AI)** | Trung bình | Trung bình | Cache kết quả AI trong DynamoDB (tra cứu lai ghép `process-nutrition`), giới hạn tốc độ request, cấu hình AWS Budget alert ở ngưỡng $80/tháng |
| **Lỗi Xác thực (Cognito/JWT)** | Cao | Thấp | Testing E2E toàn diện cho luồng federation, dự phòng AsyncStorage sessions cục bộ, xử lý `UserNotConfirmedException` và `NotAuthorizedException` |
| **Ảo giác AI (Dữ liệu Sai)** | Trung bình | Trung bình | Tinh chỉnh prompt templates trong `ai-engine` với JSON schema bắt buộc, cho phép người dùng xác minh/sửa dữ liệu dinh dưỡng AI tạo ra, duy trì ~200 món Việt đã xác minh sẵn trong DynamoDB |
| **Rào cản iOS (macOS/Xcode)** | Thấp | Cao | Chiến lược Android-first cho MVP, sử dụng EAS Build cloud cho iOS builds, lên kế hoạch macOS CI runners ở giai đoạn sau |
| **Mơ hồ Table Discovery DynamoDB** | Trung bình | Thấp | **Nguyên nhân gốc:** Lambda `friendRequest` ban đầu dùng `discoverTables()` động qua `ListTables`, trả về sai tên bảng khi nhiều suffix môi trường cùng tồn tại (Sandbox + `feat/phase3` + `main`). **Cách xử lý (đã áp dụng trong `backend.ts`):** inject tên bảng chính xác theo từng deployment qua CDK escape hatch — `cfnFriendRequestFn.addPropertyOverride('Environment.Variables.USER_TABLE_NAME', backend.data.resources.tables['user'].tableName)` và tương tự cho `FRIENDSHIP_TABLE_NAME`. CDK tự resolve đúng ARN suffix cho từng môi trường lúc deploy. |
| **Khả dụng Region Bedrock** | Thấp | Thấp | Hiện dùng ap-southeast-2; dự phòng us-east-1 với cấu hình Lambda cross-region nếu cần |

**Kế hoạch Dự phòng**

- Chuyển về nhập liệu thủ công hoặc DynamoDB fuzzy match (~200 món Việt đã nạp sẵn) khi luồng AI hoặc tích hợp Bedrock gặp sự cố.
- Sử dụng cơ chế rollback CloudFormation/Amplify cho các triển khai backend gây lỗi trên 3 môi trường.
- Chuyển từ Qwen3-VL sang các model Bedrock thay thế (Claude Haiku, Llama) nếu chi phí trở nên cấm cản ở quy mô lớn.

### 8. Kết quả Mong đợi

**Cải tiến Kỹ thuật:**

- Thu thập dữ liệu dinh dưỡng tự động hóa thời gian thực qua ảnh/giọng nói thay thế quy trình nhập liệu thủ công tẻ nhạt, giảm thời gian ghi nhật ký trung bình từ ~3 phút xuống ~10 giây.
- Hạ tầng backend serverless phân tán, có khả năng mở rộng cao, xây dựng trên nền AWS, sẵn sàng chịu tải cho 10.000+ người dùng đồng thời với chi phí idle gần bằng 0 ($0.47/tháng DynamoDB cơ bản).
- Chiến lược AI lai ghép (DynamoDB fuzzy match + Bedrock AI dự phòng) cân bằng giữa hiệu quả chi phí và tính toàn vẹn dữ liệu.

**Giá trị Dài hạn**

- Xây dựng kho cơ sở dữ liệu món ăn Việt Nam xác minh, mở rộng tự nhiên bởi người dùng và AI — hiện đã khởi tạo sẵn ~200 món và đang phát triển.
- Cung cấp các mẫu kiến trúc AI-generation tái sử dụng (prompt templates, Lambda orchestration, Bedrock integration) áp dụng được cho các tính năng sức khỏe tương lai.
- Tạo ra nền tảng sức khỏe xã hội với cơ chế gamification (thú cưng tiến hóa, chuỗi ngày, thử thách) thúc đẩy tương tác hàng ngày và giữ chân người dùng.

### 9. Các Bước Tiếp Theo

- **Pipeline phát hành iOS:** chuyển MVP Android-first sang iOS qua EAS Build cloud runners, sau đó kích hoạt macOS CI runner được quản lý khi lượng user đủ lớn để bù chi phí cố định.
- **Mở rộng cơ sở dữ liệu món Việt:** phát triển bảng `Food` từ ~200 item seed ban đầu bằng cách thu thập các entry do AI tạo (`"source": "AI Generated"` → `verified=false`) để con người review, mục tiêu 1.000+ món đã xác minh sau Năm 1.
- **Gói đăng ký Premium:** xác thực mô hình giá (mục tiêu: tỉ lệ chuyển đổi một chữ số đủ bù baseline $60.87/tháng), phát hành phân tích ảnh không giới hạn, báo cáo AI coach tuần, và biểu đồ macro nâng cao.
- **Observability:** kết nối 4 custom CloudWatch metrics (`Bedrock_AI_Error_Rate`, `Image_Processing_Time`, `User_Daily_Active`, `Food_Log_Count`) vào dashboard + Budget alarm ngưỡng $80/tháng.
- **Fallback Bedrock cross-region:** nếu capacity Qwen3-VL ở `ap-southeast-2` bị giới hạn, bổ sung route dự phòng đến Claude Haiku `us-east-1` để đảm bảo SLA.
