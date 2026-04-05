### Mục tiêu Tuần 3

* Tìm hiểu sâu về Amazon Bedrock và các dịch vụ AI/ML trên AWS.
* Đánh giá và chọn lọc ý tưởng dự án cùng team.
* Tiếp tục học kiến trúc serverless.
* Nghiên cứu Bedrock Knowledge Base cho RAG (Retrieval-Augmented Generation).

### Các nhiệm vụ thực hiện trong tuần

| Ngày | Nhiệm vụ | Ngày BĐ | Ngày HT | Tài liệu tham khảo |
| --- | --- | --- | --- | --- |
| 1 | - Thảo luận ý tưởng dự án <br>&emsp; + Đánh giá 3 đề xuất: NutriTrack, SnapChef, Secure-RAG <br>&emsp; + Mỗi thành viên trình bày proposal của mình | 19/01/2026 | 19/01/2026 | [Meeting Notes] |
| 2 | - Deep Dive: Amazon Bedrock <br>&emsp; + Tổng quan Foundation Models <br>&emsp; + So sánh Claude, Titan, Llama <br>&emsp; + Pricing và use cases | 20/01/2026 | 20/01/2026 | [AWS Bedrock Docs](https://docs.aws.amazon.com/bedrock/) |
| 3 | - Nghiên cứu: Bedrock Knowledge Base <br>&emsp; + Hiểu quy trình RAG <br>&emsp; + Data ingestion và vector embeddings <br>&emsp; + Tích hợp OpenSearch Serverless | 21/01/2026 | 21/01/2026 | [Bedrock KB Docs](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-how-it-works.html) |
| 4 | - Học Serverless Architecture <br>&emsp; + Pattern API Gateway + Lambda <br>&emsp; + DynamoDB cho ứng dụng serverless <br>&emsp; + Kiến trúc event-driven | 22/01/2026 | 22/01/2026 | [Serverless on AWS](https://aws.amazon.com/serverless/) |
| 5 | - Họp Team: Hoàn thiện Proposal <br>&emsp; + Kết hợp concept SnapChef + NutriTrack <br>&emsp; + Focus vào health & nutrition tracking <br>&emsp; + Gợi ý bữa ăn bằng AI | 23/01/2026 | 23/01/2026 | [Proposal Draft v1] |
| 6-7 | - Viết tài liệu & Tự học <br>&emsp; + Phác thảo kiến trúc ban đầu cho NutriTrack <br>&emsp; + Cập nhật website báo cáo cá nhân | 24/01/2026 | 25/01/2026 | - |

### Thành tựu Tuần 3

* Kiến thức AI/ML:
  * Hiểu toàn diện về hệ sinh thái **Amazon Bedrock**.
  * Học cách **Knowledge Bases** triển khai RAG: data chunking → vector embeddings → semantic search → augmented generation.
  * So sánh Foundation Models: Claude 3 (reasoning tốt nhất), Titan (AWS native), Llama 3 (open-source).

* Tiến độ dự án:
  * Team thu hẹp từ 3 proposal xuống 1 concept kết hợp: **NutriTrack** (NutriTrack + SnapChef).
  * Hoàn thành bản phác thảo kiến trúc ban đầu theo hướng serverless.

* Kỹ năng Serverless:
  * Hiểu API Gateway routing và Lambda trigger patterns.
  * Học các concept thiết kế single-table DynamoDB.

### Khó khăn & Bài học

* **Khó khăn:**
  * Các khái niệm RAG khá phức tạp; vector embeddings và similarity search đòi hỏi hiểu biết toán học.
  * Team có các vision khác nhau về dự án; cần nhiều buổi thảo luận để align.

* **Cách giải quyết:**
  * Xem các tutorial YouTube về embeddings và vector databases.
  * Tạo Miro board chung để visualize ý tưởng của mọi người trước khi voting.

* **Bài học rút ra:**
  * RAG rất mạnh nhưng cần chuẩn bị dữ liệu đúng cách (chunking strategy quan trọng).
  * Align sớm trong team tiết kiệm thời gian sau này; giải quyết conflict sớm tránh vấn đề lớn hơn.

### Kế hoạch Tuần 4

* Chốt và vote chính thức cho project proposal (NutriTrack).
* Bắt đầu thiết kế kiến trúc chi tiết cho NutriTrack.
* Tham gia sự kiện AWS re:Invent 2025 Recap tại Văn phòng AWS Việt Nam.
* Học về Amazon S3 advanced features và Amazon Cognito cho authentication.
