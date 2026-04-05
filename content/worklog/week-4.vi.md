### Mục tiêu Tuần 4

* Chính thức chốt và phê duyệt NutriTrack làm dự án team.
* Tham gia sự kiện AWS re:Invent 2025 Recap tại Văn phòng AWS Việt Nam.
* Bắt đầu thiết kế kiến trúc chi tiết cho NutriTrack.
* Tìm hiểu Amazon Cognito và S3 advanced features.

### Các nhiệm vụ thực hiện trong tuần

| Ngày | Nhiệm vụ | Ngày BĐ | Ngày HT | Tài liệu tham khảo |
| --- | --- | --- | --- | --- |
| 1 | - Họp Team: Quyết định dự án cuối cùng <br>&emsp; + Trình bày NutriTrack proposal hoàn thiện <br>&emsp; + Vote nhất trí thông qua <br>&emsp; + Phân vai trò: AI + DevOps + Backend (tôi), Frontend (2), AI/ML (1), PM (1) | 26/01/2026 | 26/01/2026 | [Proposal v2.0] |
| 2 | - **Sự kiện AWS re:Invent 2025 Recap** <br>&emsp; + Địa điểm: Văn phòng AWS (Tầng 26 & 36) <br>&emsp; + Sự kiện cả ngày với 5 phiên kỹ thuật <br>&emsp; + Networking với AWS Solution Architects | 27/01/2026 | 27/01/2026 | [Event Notes] |
| 3 | - Tổng hợp sự kiện & Chia sẻ kiến thức <br>&emsp; + Ghi chép key learnings từ re:Invent <br>&emsp; + Chia sẻ insights về Bedrock Agents với team <br>&emsp; + Khám phá SageMaker Unified Studio | 28/01/2026 | 28/01/2026 | [Internal Wiki] |
| 4 | - Deep Dive: Amazon Cognito <br>&emsp; + User Pools vs Identity Pools <br>&emsp; + Quản lý JWT token <br>&emsp; + Social login integration patterns | 29/01/2026 | 29/01/2026 | [Cognito Docs](https://docs.aws.amazon.com/cognito/) |
| 5 | - Thiết kế kiến trúc <br>&emsp; + Tạo sơ đồ kiến trúc high-level <br>&emsp; + Chọn các dịch vụ AWS cốt lõi cho NutriTrack <br>&emsp; + Xác định data flow và API structure | 30/01/2026 | 30/01/2026 | [Architecture Draft v1] |
| 6-7 | - Tìm hiểu S3 Advanced Features <br>&emsp; + S3 Event Notifications <br>&emsp; + S3 Lifecycle Policies <br>&emsp; + S3 Transfer Acceleration <br>&emsp; + Cập nhật website với nội dung Tuần 4 | 31/01/2026 | 01/02/2026 | [S3 Docs](https://docs.aws.amazon.com/s3/) |

### Thành tựu Tuần 4

* **Dấu mốc dự án:**
  * ✅ **NutriTrack chính thức được phê duyệt** làm dự án capstone.
  * Xác định scope: Theo dõi dinh dưỡng bằng AI với nhận diện thực phẩm từ ảnh.
  * Vai trò của tôi: **AI Integration + DevOps + Backend API** — chịu trách nhiệm kỹ thuật cốt lõi.

* **Bài học từ sự kiện AWS re:Invent 2025 Recap:**
  * **Amazon Bedrock & Nova Models:** Tìm hiểu về Nova models và khả năng fine-tuning.
  * **Bedrock Agents (Agentic AI):** Hiểu Orchestration/Flow, Memory, Policy/Guardrails — liên quan đến thiết kế tool-use loop.
  * **SageMaker Unified Studio:** IDE thống nhất cho Data Engineers, Data Scientists và AI Engineers.
  * **Amazon S3 Updates:** S3 Tables (Iceberg support) và S3 Vector cho native vector storage.

* **Kiến thức kỹ thuật:**
  * Nắm vững các pattern authentication của Amazon Cognito — đặc biệt JWT flow.
  * Hiểu S3 advanced features liên quan đến NutriTrack (image upload, lifecycle).

### Khó khăn & Bài học

* **Khó khăn:**
  * Quá tải thông tin từ sự kiện re:Invent (5 phiên trong 1 ngày).
  * Mapping các service mới vào yêu cầu NutriTrack cần đánh giá cẩn thận.

* **Cách giải quyết:**
  * Ghi chép có cấu trúc trong mỗi phiên với cột "Liên quan đến NutriTrack".
  * Họp review team ngày hôm sau để lọc insights có thể áp dụng.

* **Bài học rút ra:**
  * AWS liên tục đổi mới; cập nhật kiến thức là thiết yếu cho quyết định kiến trúc.
  * Bedrock Agents có thể là enhancement tương lai cho NutriTrack.

### Kế hoạch Tuần 5

* Bắt đầu viết Proposal documentation với kiến trúc chi tiết và timeline.
* Thiết lập AWS development environment (IAM roles, S3 buckets).
* Nghiên cứu AI pipeline: food detection → nutrition analysis.
* Tìm hiểu VLM (Vision-Language Models) cho nhận diện thực phẩm.
