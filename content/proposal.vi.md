# Nền tảng NutriTrack

## Giải pháp AWS Serverless toàn diện cho Theo dõi Dinh dưỡng tích hợp AI

### 1. Tóm tắt Dự án (Executive Summary)

Nền tảng NutriTrack 2.0 được thiết kế cho [Đối tượng mục tiêu / Nhóm người dùng, ví dụ: Gen Z / Millennials Việt Nam] nhằm nâng cao khả năng quản lý sức khỏe cá nhân và theo dõi dữ liệu dinh dưỡng. Nền tảng hỗ trợ [Quy mô người dùng, ví dụ: 5.000+ người dùng hoạt động], sử dụng giao diện di động đa nền tảng (React Native/Expo) để thu thập và phân tích dữ liệu chế độ ăn uống. Bám sát các nguyên tắc của AWS Well-Architected Framework, nền tảng tận dụng tối đa hệ sinh thái AWS Serverless (AWS Amplify Gen 2, AppSync, Lambda) và Generative AI (Amazon Bedrock dòng Qwen3-VL) nhằm mang đến hệ thống theo dõi dinh dưỡng thời gian thực, ghi nhật ký bằng AI dự đoán, cơ chế gamification (chuỗi ngày, tiến hóa thú cưng) và tối ưu chi phí, với quyền truy cập được bảo mật tuyệt đối qua [Dịch vụ Xác thực, ví dụ: Amazon Cognito].

### 2. Tuyên bố Vấn đề (Problem Statement)

**Vấn đề là gì?**
Các ứng dụng theo dõi dinh dưỡng hiện tại đòi hỏi người dùng phải nhập liệu thủ công một cách tẻ nhạt và thường thiếu các cơ sở dữ liệu món ăn Việt Nam cá nhân hóa phong phú. Hơn nữa, người dùng thường gặp rắc rối trong việc lên thực đơn hàng ngày cũng như quản lý thực phẩm dự trữ, dễ dẫn đến lãng phí thức ăn và thói quen ăn uống không nhất quán. Chưa có một hệ thống thông minh nào tích hợp AI theo thời gian thực để tạo ra hồ sơ món ăn bị thiếu hay gợi ý công thức nấu ăn từ nguyên liệu sẵn có, trong khi những API của bên thứ ba hiện tại thường đắt đỏ và hạn chế.

**Giải pháp**
Nền tảng sử dụng AWS AppSync GraphQL API để tiếp nhận dữ liệu ăn uống của người dùng, AWS Lambda để xử lý logic backend, Amazon DynamoDB để lưu trữ có khả năng mở rộng, và Amazon Bedrock (Qwen3-VL) cho luồng AI phân tích ảnh đồ ăn và tạo dữ liệu dinh dưỡng bị hụt ngay lập tức. AWS Amplify Gen 2 kết hợp với React Native/Expo cung cấp giao diện người dùng. Các tính năng chính bao gồm biểu đồ thời gian thực (hiển thị Đạm, Carbs, Chất béo, Calo), tính năng ghi âm món ăn qua AWS Transcribe, quản lý tủ lạnh/nhà bếp (Kitchen inventory), chức năng AI gợi ý công thức nấu ăn, hệ thống huấn luyện viên AI ("Ollie") và gamification xã hội.

**Lợi ích và Tỷ suất Hoàn vốn (ROI)**
Giải pháp này thiết lập một hệ sinh thái nền tảng cố lõi giúp người dùng theo dõi sức khỏe và giúp đội ngũ phát triển mở rộng quy mô một ứng dụng sức khỏe tích hợp AI. Nó giảm bớt rào cản khi nhập liệu thủ công nhờ vào luồng AI, đơn giản hóa trải nghiệm người dùng và cải thiện độ tin cậy của dữ liệu. Nhờ tận dụng tối đa hạng mức AWS Free Tier và mô hình serverless pay-as-you-go, hệ thống giảm thiểu triệt để chi phí vận hành hàng tháng. Thời gian hoàn vốn ước tính khoảng [Khoảng thời gian, ví dụ: 6-12 tháng], đạt được thông qua [Mô hình Doanh thu, ví dụ: phí đăng ký của người dùng hoặc sự tiết kiệm đáng kể thời gian / năng suất team].

### 3. Kiến trúc Giải pháp

Nền tảng sử dụng kiến trúc serverless của AWS để quản lý dữ liệu người dùng và các phản hồi từ AI một cách mượt mà. Dữ liệu được xử lý qua GraphQL API (AppSync), lưu trữ trong DynamoDB và làm phong phú thêm thông qua các hàm Lambda kết nối với Bedrock. Ứng dụng di động được quản lý và điều phối bởi AWS Amplify.

*Kiến trúc Ứng dụng Di động NutriTrack*
*[Placeholder cho Sơ đồ Kiến trúc]*

*Kiến trúc Nền tảng NutriTrack*
*[Placeholder cho Sơ đồ Kiến trúc]*

**Các dịch vụ AWS được sử dụng**

| Dịch vụ | Vai trò |
|---------|----------|
| **AWS Amplify Gen 2** | Điều phối triển khai và CI/CD trên 3 môi trường khác nhau. |
| **AWS AppSync** | Hỗ trợ giao tiếp GraphQL API bảo mật giữa ứng dụng React Native và backend. |
| **AWS Lambda** | Xử lý logic nghiệp vụ qua 4 hàm cục bộ (`ai-engine`, `process-nutrition`, `friend-request`, `resize-image`). |
| **Amazon DynamoDB** | Lưu trữ hồ sơ người dùng, nhật ký và dữ liệu dinh dưỡng trong 7 model noSQL cấu trúc lớn. |
| **Amazon Bedrock** | Vận hành tính năng AI (sử dụng Qwen3-VL 235B) phân tích hình ảnh tĩnh và tạo ra dữ liệu dinh dưỡng. |
| **AWS Transcribe** | Chuyển đổi bản thảo giọng nói sang dạng văn bản để ghi log bằng giọng nói. |
| **Amazon S3** | Lưu trữ ảnh tải lên và thư mục đã qua xử lý (`incoming/`, `voice/`, `media/`). |
| **Amazon Cognito** | Bảo mật truy cập bằng email/OTP và Google OAuth, quản lý các JWT định danh token. |

**Thiết kế Thành phần**

* **Thiết bị Khách (Client Devices):** React Native/Expo di động thu thập đầu vào của người dùng (Camera, Mic) và trực quan hóa dữ liệu dinh dưỡng với giao diện gamification, đồng thời tích hợp tính năng quản lý thực phẩm trong bếp.
* **Tiếp nhận Dữ liệu:** AppSync nhận các GraphQL mutations/queries từ ứng dụng di động.
* **Lưu trữ Dữ liệu:** Các bảng DynamoDB quản lý an toàn 7 model dữ liệu (Food, user, FoodLog, FridgeItem, Challenge, Friendship, UserPublicStats).
* **Xử lý AI:** Lambda `ai-engine` xử lý 10 tác vụ AI kết hợp (vd: phân tích ảnh, chuyển giọng nói sang đồ ăn, tạo công thức nấu ăn từ tủ lạnh, mẹo cho huấn luyện viên) giao tiếp với Bedrock API.
* **Quản lý Người dùng:** Cognito xử lý đăng ký, phân quyền, và quản lý kiểm soát truy cập phân tán, được tăng cường bởi bảo mật sinh trắc học (FaceID/TouchID) trên thiết bị.

### 4. Triển khai Kỹ thuật

**Các Giai đoạn Triển khai**
Dự án này tuân theo 4 giai đoạn:

1. **Xây dựng Nền tảng và Thiết kế Kiến trúc:** Nghiên cứu cấu hình React Native/Expo với AWS Amplify Gen 2 và thiết kế kiến trúc serverless bao gồm cấu hình tích hợp AI Bedrock (Tháng 0).
2. **Tính toán Chi phí và Kiểm tra Tính khả thi:** Sử dụng AWS Pricing Calculator để ước tính chi phí (gọi Lambda, lượng token Bedrock, dung lượng DynamoDB) và điều chỉnh kiến trúc nếu cần (Tháng 1).
3. **Phát triển, Kiểm thử, và Triển khai:** Lập trình UI React Native, backend AWS với TypeScript/CDK, triển khai 4 hàm Lambda, và giải quyết các luồng xác thực token. Kiểm thử và đưa lên môi trường Production (Tháng 2-3).
4. **Tinh chỉnh và Tối ưu hóa:** Đánh giá Audit UX/UI, cải thiện các tính năng gamification và sửa lỗi tích hợp (ví dụ: lỗi token JWT định danh) (Sau khi Launch).

**Yêu cầu Kỹ thuật**

* **Frontend:** React Native, Expo, TypeScript. Yêu cầu triển khai việc dàn trang nội dung phức tạp (quản lý trạng thái bằng Zustand, i18n đa ngôn ngữ).
* **Backend:** Có kiến thức chuyên môn về AWS Amplify Gen 2, Lambda, AppSync (GraphQL), DynamoDB và Cognito (AWS CDK/SDK).
* **Tích hợp AI:** Kinh nghiệm với Amazon Bedrock API (đặc biệt là Qwen3-VL), AWS Transcribe, và cấu trúc embed prompt engineering.

### 5. Lịch trình & Cột mốc

**Lịch trình Dự án**

| Giai đoạn | Thời lượng | Chi tiết |
|-----------|------------|----------|
| **Giai đoạn Tiền kỳ** | 1 Tháng (Tháng 0) | Lập kế hoạch UI/UX, đánh giá phiên bản tài liệu cũ, và thiết kế phác thảo kiến trúc. |
| **Triển khai** | 3 Tháng | **Tháng 1:** Khởi tạo môi trường AWS và thiết lập lõi UI cơ bản của React Native.<br>**Tháng 2:** Kết nối API AppSync, khởi tạo lược đồ DynamoDB, kết hợp bảo mật Cognito.<br>**Tháng 3:** Lập trình Lambda `ai-engine` Bedrock, test cơ chế gamification, test E2E để vá lỗi, và phát hành. |
| **Sau Phát hành** | Liên tục | Giữ vững tối ưu hóa và đẩy mạnh phổ người dùng trong [Thời gian dự trù, ví dụ: 1 năm]. |

### 6. Ước tính Ngân sách

Bạn có thể tìm thấy ước tính ngân sách trên AWS Pricing Calculator.
Hoặc bạn có thể tải xuống Tệp Ước tính Ngân sách [Placeholder Liên kết].

**Chi phí Hạ tầng (Ước lượng)**

| Thành phần | Ước tính Chi Phí | Ghi chú |
|------------|------------------|---------|
| **AWS Lambda** | $[Placeholder]/tháng | Miễn phí 1 triệu cuộc gọi/tháng |
| **Amazon DynamoDB** | $[Placeholder]/tháng | Bộ nhớ, tốc độ đọc/ghi (Miễn phí) |
| **AWS AppSync** | $[Placeholder]/tháng | Cấu hình API (Miễn phí) |
| **Amazon S3** | $[Placeholder]/tháng | Không gian lưu trữ thư mục (Miễn phí) |
| **AWS Transcribe** | $[Placeholder]/tháng | Miễn phí 60 giờ / tháng |
| **Amazon Bedrock** | ~$0.006/ảnh | Mức phí giao hoán tuỳ volume xử lý của Qwen3-VL |
| **AWS Amplify & Cognito** | $[Placeholder]/tháng | Miễn phí 50,000 MAU free |
| **Tổng Ước Lượng** | **$[Placeholder]/tháng** | **$[Placeholder]/12 tháng** |

**Chi phí Phần mềm/Bản quyền:** $[Placeholder] (ví dụ: Tài khoản nhà phát triển, công cụ CI/CD).

### 7. Đánh giá Rủi ro

**Ma trận Rủi ro**

| Rủi ro | Tác động | Xác suất |
|--------|----------|----------|
| **Vượt chi phí bằng AI Bedrock APIs** | Trung bình | Trung bình |
| **Lỗi xác thực (Cognito/JWT Tokens)** | Cao | Thấp |
| **Ảo giác AI (Dữ liệu Sai Cấu Hình)** | Trung bình | Trung bình |
| **Rào Cản iOS App (cần chuẩn macOS/Xcode)** | Thấp | Cao |

**Chiến lược Giảm thiểu**

* **Chi phí:** Khởi chạy lưu caching các giá trị AI trên DynamoDB (theo luật tra cứu tuỳ chỉnh `process-nutrition`) và đồng bộ cùng việc khoanh vùng mức phí cảnh báo AWS limit.
* **Xác thực:** Rà soát kỹ luồng E2E test cho khối Cognito theo quy cách; thiết kế sẵn luồng chặn lỗi cho phương thức truy xuất cục bộ.
* **Độ chính xác AI:** Xây dựng sát prompt chuẩn hóa trên `ai-engine`, bắt ép các template đuôi JSON khi xuất đầu ra, và duyệt qua thao tác chỉnh độ chính xác từ user.
* **Nền tảng hỗ trợ:** Chủ lực tập trung khối nền Android cho buổi ra quân demo trước; triển khai khối macOS runners trên nền mây cho khối build của iOS ở phiên bản cập nhật kế tiếp.

**Kế hoạch Dự phòng**

* Chuyển lại trạng thái nhập liệu manual tay hoặc qua ứng dụng DynamoDB fuzzy match (~200 món ăn VN thân quen) khi block mã AI dẫn Bedrock sụt nổ diện mạng.
* CloudFormation/Amplify rollback theo mức khoá lại bản backup build nguyên vẹn phiên bản hoàn chỉnh của backend.

### 8. Kết quả Mong đợi

**Cải tiến Kỹ thuật:**

* Thu thập dữ liệu dinh dưỡng tự động hoá tích tắc thay vì đi vào bước check list buồn chán lặp đi lặp lại.
* Một hạ tầng backend serverless phân tán toàn diện trên AWS, sẵn sàng chịu tải mượt cho [Placeholder, ví dụ: 10,0000+] người dùng đồng thời với chi phí rảnh rỗi (idle cost) gần như bằng không.

**Giá trị Dài hạn**

* Gầy dựng nên kho cơ sở dữ liệu nền cho kho đồ ăn Việt chân thực xác suất cao phân luồng bởi thao tác tự khai báo hệ người dùng cũng như hệ AI tự định hình.
* Đặt ra cấu trúc mạng máy sinh dạng chuẩn có thể dùng đi tái sửa để cung cấp tính năng phục vụ tiện ích sức khoẻ về chiều sau ở mức bền lớn.
