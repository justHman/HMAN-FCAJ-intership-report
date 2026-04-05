### Mục tiêu Tuần 11

* Thiết lập CI/CD pipeline với GitHub Actions cho ECS Fargate deployment.
* Tối ưu prompt engineering để giảm token usage và chi phí API.
* Implement hệ thống cache crawling cho pre-populating nutrition data.
* Bắt đầu Terraform infrastructure-as-code và deploy trên Fly.io.

### Các nhiệm vụ thực hiện trong tuần

| Ngày | Nhiệm vụ | Ngày BĐ | Ngày HT | Tài liệu tham khảo |
| --- | --- | --- | --- | --- |
| 1 | - Thiết lập CI/CD Pipeline <br>&emsp; + Tạo GitHub Actions workflow cho ECS deployment <br>&emsp; + Cấu hình ECS Fargate ARM với capacity provider (FARGATE_SPOT) <br>&emsp; + Implement crawl data pipeline cho cache clients | 16/03/2026 | 16/03/2026 | [GitHub Actions] |
| 2 | - Đồng bộ Cache Data <br>&emsp; + Sync dữ liệu 3 nutrition API clients <br>&emsp; + Implement batch retrieval cho tool responses giảm latency <br>&emsp; + Hoàn thành testing cho cache sync | 18/03/2026 | 18/03/2026 | [Cache Sync Code] |
| 3 | - Tối ưu Prompt & Token (Phần 1) <br>&emsp; + Tối ưu tokens cho food và label detection prompts <br>&emsp; + Giảm input/output token count <br>&emsp; + Dọn dẹp và đơn giản hóa function definitions | 20/03/2026 | 20/03/2026 | [Optimization Notes] |
| 4 | - Tối ưu Prompt & Token (Phần 2) <br>&emsp; + Ép output format CSV để minimize output tokens <br>&emsp; + Tối ưu prompt speed và giảm chi phí API <br>&emsp; + Xử lý edge cases: không có items và nhiều items | 22/03/2026 | 22/03/2026 | [Token Analysis] |
| 5 | - Deploy Fly.io <br>&emsp; + Thiết lập Fly.io làm nền tảng deploy thay thế <br>&emsp; + Cấu hình fly.toml và deployment scripts <br>&emsp; + Test deployment với Claude model integration | 22/03/2026 | 22/03/2026 | [Fly.io Docs] |
| 6-7 | - Terraform & Documentation <br>&emsp; + Bắt đầu Terraform IaC cho AWS infrastructure <br>&emsp; + Viết tài liệu deployment <br>&emsp; + Setup pytest cho automated testing trong CI/CD <br>&emsp; + Code review và graph documentation | 22/03/2026 | 22/03/2026 | [Terraform Config] |

### Thành tựu Tuần 11

* **CI/CD Pipeline:**
  * GitHub Actions workflow deploy lên ECS Fargate ARM + Spot thành công.
  * Automated pipeline: push → build Docker image → deploy ECS.
  * Capacity provider strategy: FARGATE_SPOT cho tối ưu chi phí.

* **Tối ưu Token & Prompt:**
  * Ép **format output CSV** — giảm output tokens đáng kể (lên đến 60%).
  * Tối ưu prompts cho cả food detection và label analysis.
  * Implement batch tool calling giảm API call latency.
  * Tiết kiệm chi phí đáng kể trên Bedrock API usage.

* **Hệ thống Cache:**
  * Cache 2 tầng triển khai hoàn chỉnh:
    * **L1 Cache (User):** In-memory cache cho dữ liệu phiên hiện tại.
    * **L2 Cache (File):** JSON file-based persistent cache trên volume storage.
  * Cache crawling pipeline: pre-populate cache với dữ liệu thực phẩm phổ biến.
  * Batch retrieval từ tools giảm latency cho multi-item queries.

* **Multi-Platform Deployment:**
  * ECS Fargate ARM + Spot cho production (AWS).
  * Fly.io là alternative tiết kiệm cho development/staging.

* **Terraform:**
  * Bắt đầu infrastructure-as-code cho AWS deployments reproducible.

### Khó khăn & Bài học

* **Khó khăn:**
  * ECS FARGATE_SPOT instances có thể bị interrupt — cần xử lý graceful.
  * Cân bằng prompt optimization: giảm quá mạnh có thể ảnh hưởng accuracy.
  * Cache sync giữa Fly.io volume và S3 cần thiết kế cẩn thận.

* **Cách giải quyết:**
  * Dùng capacity provider strategy với weight=1 cho Spot để có fallback.
  * A/B test thay đổi prompt để đảm bảo accuracy được duy trì.
  * Implement cache merge strategy: get từ Fly → merge local → upload S3.

* **Bài học rút ra:**
  * CSV output format hiệu quả đáng ngạc nhiên trong việc giảm LLM token usage.
  * Cache pre-population (crawling) có thể giảm runtime latency đáng kể.
  * Multi-platform deployment (ECS + Fly.io) mang lại redundancy và flexibility chi phí.

### Kế hoạch Tuần 12

* Chuẩn bị final presentation và rehearsal.
* Implement JWT token return trong API responses.
* Deploy ECS trong private subnet với full networking (ALB, NAT).
* S3 cache synchronization cho persistent storage.
* Hoàn thành tất cả documentation và báo cáo thực tập.
