### Mục tiêu Tuần 4

* Chính thức chốt và phê duyệt NutriTrack làm dự án của team.
* Tham gia sự kiện AWS re:Invent 2025 Recap tại Văn phòng AWS Việt Nam.
* Bắt đầu thiết kế kiến trúc chi tiết cho NutriTrack.
* Học Amazon Cognito và các tính năng nâng cao của S3.

### Các nhiệm vụ thực hiện trong tuần

| Ngày | Nhiệm vụ | Ngày BĐ | Ngày HT | Tài liệu tham khảo |
| --- | --- | --- | --- | --- |
| 1 | - Họp Team: Quyết định dự án cuối cùng <br>&emsp; + Trình bày proposal NutriTrack hoàn chỉnh <br>&emsp; + Vote đồng thuận triển khai <br>&emsp; + Phân công vai trò cho từng thành viên | 26/01/2026 | 26/01/2026 | [Proposal v2.0] |
| 2 | - **Sự kiện AWS re:Invent 2025 Recap** <br>&emsp; + Địa điểm: Văn phòng AWS (Tầng 26 & 36) <br>&emsp; + Sự kiện cả ngày với 5 phiên kỹ thuật <br>&emsp; + Networking với AWS Solution Architects | 27/01/2026 | 27/01/2026 | [Event Notes] |
| 3 | - Tổng kết Event & Chia sẻ kiến thức <br>&emsp; + Ghi chép các kiến thức chính từ re:Invent <br>&emsp; + Chia sẻ insights về Bedrock Agents với team <br>&emsp; + Tìm hiểu sự liên quan của SageMaker Unified Studio | 28/01/2026 | 28/01/2026 | [Internal Wiki] |
| 4 | - Deep Dive: Amazon Cognito <br>&emsp; + User Pools vs Identity Pools <br>&emsp; + Quản lý JWT token <br>&emsp; + Tích hợp social login | 29/01/2026 | 29/01/2026 | [Cognito Docs](https://docs.aws.amazon.com/cognito/) |
| 5 | - Phiên thiết kế Architecture <br>&emsp; + Tạo sơ đồ kiến trúc high-level <br>&emsp; + Chọn các dịch vụ AWS cốt lõi cho NutriTrack <br>&emsp; + Định nghĩa data flow và cấu trúc API | 30/01/2026 | 30/01/2026 | [Architecture Draft v1] |
| 6-7 | - Học S3 Advanced Features <br>&emsp; + S3 Event Notifications <br>&emsp; + S3 Lifecycle Policies <br>&emsp; + S3 Transfer Acceleration <br>&emsp; + Cập nhật website với nội dung Week 4 | 31/01/2026 | 01/02/2026 | [S3 Docs](https://docs.aws.amazon.com/s3/) |

### Thành tựu Tuần 4

* **Cột mốc dự án:**
  * ✅ **NutriTrack chính thức được phê duyệt** làm dự án capstone của team.
  * Xác định phạm vi dự án: AI-powered nutrition tracking với gợi ý bữa ăn.
  * Phân công vai trò: Backend (2), Frontend (1), AI/ML (1), DevOps (1).

* **Kiến thức từ sự kiện AWS re:Invent 2025 Recap:**
  * **Amazon Bedrock & Nova Models:** Học về Nova Text-to-Speech, Nova Canvas, và khả năng fine-tuning cho ngữ cảnh địa phương (VD: luật Việt Nam).
  * **Bedrock Agents (Agentic AI):** Hiểu các thành phần Orchestration/Flow, Memory, Policy/Guardrails, và Evaluation.
  * **SageMaker Unified Studio:** Khám phá IDE hợp nhất cho Data Engineers, Data Scientists và AI Engineers với one-click onboarding.
  * **Amazon S3 Updates:** Học về S3 Tables (hỗ trợ Iceberg) và S3 Vector cho lưu trữ vector native với chi phí giảm đáng kể.
  * **OpenSearch Agentic Search:** Tích hợp MCP, Agent Memory, và các agents chuyên biệt cho analytics.
  * **Advanced RAG:** Nova Multimodal Embeddings cho tìm kiếm video/ảnh.

* **Kiến thức kỹ thuật:**
  * Nắm vững các pattern authentication của Amazon Cognito.
  * Hiểu các tính năng S3 nâng cao liên quan đến NutriTrack (upload ảnh, lifecycle).

### Khó khăn & Bài học

* **Khó khăn:**
  * Quá tải thông tin từ sự kiện AWS re:Invent (5 phiên trong một ngày).
  * Ánh xạ các dịch vụ mới vào yêu cầu NutriTrack cần đánh giá cẩn thận.

* **Cách giải quyết:**
  * Tạo ghi chú có cấu trúc trong mỗi phiên với cột "Liên quan đến NutriTrack".
  * Họp review team ngày hôm sau để lọc insights có thể áp dụng.

* **Bài học rút ra:**
  * AWS liên tục đổi mới; cập nhật kiến thức là thiết yếu cho quyết định kiến trúc.
  * Bedrock Agents có thể là enhancement tương lai cho NutriTrack (conversational meal planning).
  * S3 Vector có thể giảm chi phí so với OpenSearch cho các use case vector đơn giản.

### Kế hoạch Tuần 5

* Hoàn thành sơ đồ kiến trúc chi tiết với tất cả dịch vụ AWS.
* Thiết lập môi trường phát triển AWS (IAM roles, S3 buckets).
* Bắt đầu viết tài liệu Proposal để nộp.
* Nghiên cứu Amazon API Gateway và Lambda best practices.
