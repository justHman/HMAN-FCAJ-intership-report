### Mục tiêu Tuần 6

* Nộp NutriTrack Proposal để mentor phê duyệt.
* Pivot hướng AI: nghiên cứu LLM/VLM tool-use loop architecture.
* Tìm hiểu VPC Endpoints, NAT Gateway và NAT Instance cho tối ưu chi phí.
* Nghiên cứu các nguồn dữ liệu dinh dưỡng qua API.

### Các nhiệm vụ thực hiện trong tuần

| Ngày | Nhiệm vụ | Ngày BĐ | Ngày HT | Tài liệu tham khảo |
| --- | --- | --- | --- | --- |
| 1 | - Nộp Proposal <br>&emsp; + Hoàn thiện tài liệu NutriTrack Proposal <br>&emsp; + Nộp cho mentor review <br>&emsp; + Chuẩn bị bài thuyết trình defense | 09/02/2026 | 09/02/2026 | [Final Proposal] |
| 2 | - Nghiên cứu LLM/VLM Tool-Use <br>&emsp; + Tìm hiểu cách LLMs sử dụng tools (function calling) <br>&emsp; + Nghiên cứu tool-use loop: model gọi tool → nhận kết quả → suy luận → gọi tool tiếp <br>&emsp; + So sánh: Bedrock vs direct API models | 10/02/2026 | 10/02/2026 | [LLM Research Notes] |
| 3 | - AWS Networking Deep Dive (Phần 1) <br>&emsp; + VPC Endpoints: Gateway vs Interface endpoints <br>&emsp; + NAT Gateway: managed, high availability, chi phí cao <br>&emsp; + NAT Instance: tự quản lý, chi phí thấp hơn | 11/02/2026 | 11/02/2026 | [VPC Docs](https://docs.aws.amazon.com/vpc/) |
| 4 | - AWS Networking Deep Dive (Phần 2) <br>&emsp; + So sánh chi phí: NAT Gateway ($32/tháng) vs NAT Instance (t3.micro ~$8/tháng) <br>&emsp; + Kiến trúc private subnet với NAT cho ECS tasks <br>&emsp; + Internet Gateway vs NAT cho outbound traffic | 12/02/2026 | 12/02/2026 | [VPC Endpoint Docs](https://docs.aws.amazon.com/vpc/latest/privatelink/) |
| 5 | - Nghiên cứu nguồn dữ liệu dinh dưỡng <br>&emsp; + Đánh giá USDA FoodData Central API <br>&emsp; + Test OpenFoodFacts API cho barcode lookup <br>&emsp; + Tìm hiểu Avocavo Nutrition API cho dữ liệu bổ sung | 13/02/2026 | 13/02/2026 | [API Docs] |
| 6-7 | - Chỉnh sửa kiến trúc <br>&emsp; + Thiết kế lại: VLM + tool-use loop thay cho multi-model pipeline <br>&emsp; + Draft kiến trúc mới với FastAPI backend thay Lambda <br>&emsp; + Tìm hiểu containerized deployment với ECS Fargate | 14/02/2026 | 15/02/2026 | [Architecture v2] |

### Thành tựu Tuần 6

* **Proposal:**
  * ✅ NutriTrack Proposal đã nộp và **được mentor phê duyệt**.
  * Nhận feedback tích cực về approach sử dụng AI.
  * Gợi ý: tập trung vào tool-use pattern để đạt độ chính xác và linh hoạt cao hơn.

* **Pivot kiến trúc AI:**
  * Chuyển từ multi-model pipeline phức tạp sang **LLM/VLM với tool-use loop**.
  * Approach mới: model phân tích ảnh → gọi tools tra cứu dinh dưỡng → suy luận → trả kết quả.
  * Đơn giản hơn, chính xác hơn và tiết kiệm tài nguyên hơn.

* **Kiến thức AWS Networking:**
  * Hiểu VPC Endpoints cho private service access không cần NAT.
  * NAT Instance tiết kiệm gấp 4 lần so với NAT Gateway.
  * Thiết kế kiến trúc private subnet cho ECS tasks.

* **Nguồn dữ liệu:**
  * Xác định 3 nutrition APIs: USDA, OpenFoodFacts, Avocavo — mỗi cái có điểm mạnh riêng.

### Khó khăn & Bài học

* **Khó khăn:**
  * Quyết định giữa Lambda (serverless) và ECS (containerized) cho backend.
  * VLM models cần compute resources lớn, không phù hợp với Lambda timeout 15 phút.

* **Cách giải quyết:**
  * Chọn FastAPI + ECS Fargate cho backend: phù hợp hơn cho AI inference tasks chạy lâu.
  * Lambda vẫn dùng cho lightweight triggers và non-AI endpoints.

* **Bài học rút ra:**
  * Không phải mọi thứ đều cần serverless — containers tốt hơn cho AI workloads với execution time không dự đoán được.
  * NAT Instance trên t3.micro là mẹo tiết kiệm chi phí tuyệt vời cho môi trường non-production.

### Kế hoạch Tuần 7

* Nghỉ Tết Nguyên Đán — thời gian tự học.
* Tự học: Load Balancer, ALB, Auto Scaling, Target Groups.
* Tìm hiểu thiết kế HA architecture cho production readiness.
* Chuẩn bị môi trường phát triển cho sprint coding sau Tết.
