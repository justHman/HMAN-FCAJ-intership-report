### Mục tiêu Tuần 5

* Bắt đầu viết tài liệu NutriTrack Proposal.
* Thiết lập AWS development environment (IAM, S3).
* Nghiên cứu AI pipeline: food detection → segmentation → weight estimation → nutrition lookup.
* Tìm hiểu VLM (Vision-Language Models) và khả năng nhận diện thực phẩm.

### Các nhiệm vụ thực hiện trong tuần

| Ngày | Nhiệm vụ | Ngày BĐ | Ngày HT | Tài liệu tham khảo |
| --- | --- | --- | --- | --- |
| 1 | - Tài liệu Proposal (Phần 1) <br>&emsp; + Phát biểu vấn đề và mục tiêu <br>&emsp; + Lựa chọn technology stack <br>&emsp; + Lập kế hoạch timeline | 02/02/2026 | 02/02/2026 | [Proposal Draft] |
| 2 | - Thiết lập môi trường AWS <br>&emsp; + Tạo IAM roles với least privilege <br>&emsp; + Thiết lập development IAM user cho team <br>&emsp; + Tạo S3 buckets cho media storage | 03/02/2026 | 03/02/2026 | [IAM Config] |
| 3 | - Nghiên cứu AI Pipeline (Phần 1) <br>&emsp; + Tìm hiểu vision models cho food detection <br>&emsp; + Nghiên cứu phương pháp ingredient segmentation <br>&emsp; + Tìm hiểu weight estimation (chuyển đổi pixel → cm bằng calibration) | 04/02/2026 | 04/02/2026 | [Research Notes] |
| 4 | - Nghiên cứu AI Pipeline (Phần 2) <br>&emsp; + Tìm hiểu USDA food nutrition database <br>&emsp; + Thiết kế pipeline: detect → segment → estimate weight → USDA lookup → calculate nutrition <br>&emsp; + Test model Qwen VLM cho food recognition | 05/02/2026 | 05/02/2026 | [Pipeline Design] |
| 5 | - Test Pipeline <br>&emsp; + Test end-to-end: detect ingredients → segment → estimate weight → USDA → nutrition <br>&emsp; + Phát hiện vấn đề: Qwen model rất tệ trong weight estimation <br>&emsp; + Pipeline chậm và thường xuyên OOM | 06/02/2026 | 06/02/2026 | [Test Results] |
| 6-7 | - Tài liệu Proposal (Phần 2) <br>&emsp; + Vẽ architecture diagram với AWS services <br>&emsp; + Ước tính ngân sách <br>&emsp; + Nghiên cứu model VLM thay thế cho độ chính xác tốt hơn | 07/02/2026 | 08/02/2026 | [Proposal Draft v2] |

### Thành tựu Tuần 5

* **Proposal:**
  * Bản draft Proposal hoàn thành 70% với mục tiêu, timeline và kiến trúc rõ ràng.
  * Timeline phát triển 3 tháng phù hợp với kỳ thực tập.

* **Môi trường AWS:**
  * IAM roles được cấu hình με Principle of Least Privilege.
  * S3 buckets cho media storage với policies và CORS đúng.

* **Nghiên cứu AI Pipeline:**
  * Thiết kế pipeline phân tích dinh dưỡng hoàn chỉnh: detect → segment → estimate weight → USDA lookup → calculate.
  * Khám phá 4 phương pháp calibration khác nhau cho weight estimation (chuyển pixel sang cm).
  * Phát hiện hạn chế: Qwen VLM model hoạt động kém trong weight estimation, pipeline chậm và tốn bộ nhớ.

### Khó khăn & Bài học

* **Khó khăn:**
  * Pipeline nhiều bước (detect → segment → estimate → lookup → calculate) tốn quá nhiều tài nguyên máy tính.
  * Weight estimation từ ảnh bằng VLM models có độ chính xác rất thấp.
  * Lỗi Out-of-Memory (OOM) thường xuyên khi chạy full pipeline trên local.

* **Cách giải quyết:**
  * Nghiên cứu hướng thay thế: dùng LLM tool-use thay vì multi-step vision pipeline.
  * Cân nhắc dùng cloud-based models (Bedrock) để tránh giới hạn tài nguyên local.

* **Bài học rút ra:**
  * Không phải vấn đề nào cũng cần pipeline nhiều model phức tạp — đôi khi 1 model thông minh hơn với approach đơn giản lại hiệu quả hơn.
  * Cần xác định giới hạn tài nguyên sớm để không phí thời gian vào approach không khả thi.

### Kế hoạch Tuần 6

* Hoàn thiện và nộp NutriTrack Proposal để mentor review.
* Pivot hướng AI: nghiên cứu LLM/VLM với tool-use capabilities.
* Tìm hiểu VPC Endpoints và NAT Gateway để tối ưu chi phí networking.
* Nghiên cứu các nguồn dữ liệu dinh dưỡng qua API.
