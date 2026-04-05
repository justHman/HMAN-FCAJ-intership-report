### Mục tiêu Tuần 12

* Trình bày final presentation cho tất cả stakeholders.
* Hoàn thành self-evaluation và feedback sections.
* Nộp báo cáo thực tập.
* Ăn mừng hoàn thành dự án và nhìn lại hành trình.

### Các nhiệm vụ thực hiện trong tuần

| Ngày | Nhiệm vụ                                                                                                                                                                           | Ngày BĐ    | Ngày HT    | Tài liệu tham khảo       |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- | ------------------------ |
| 1    | - Chuẩn bị Final Presentation <br>&emsp; + Tập luyện lần cuối với team <br>&emsp; + Chuẩn bị backup demo video <br>&emsp; + Test tất cả technical setup                            | 23/03/2026 | 23/03/2026 | [Presentation]           |
| 2    | - Final Presentation <br>&emsp; + Trình bày NutriTrack cho FCJ leadership <br>&emsp; + Live demo với Q&A session <br>&emsp; + Nhận lời khen về kiến trúc                           | 24/03/2026 | 24/03/2026 | [Presentation Recording] |
| 3    | - Tự đánh giá <br>&emsp; + Hoàn thành self-evaluation form <br>&emsp; + Nhìn lại hành trình 12 tuần <br>&emsp; + Xác định điểm mạnh và cần cải thiện                               | 25/03/2026 | 25/03/2026 | [Evaluation Form]        |
| 4    | - Feedback chương trình <br>&emsp; + Viết feedback chi tiết cho FCJ program <br>&emsp; + Highlight những trải nghiệm tích cực <br>&emsp; + Đề xuất cải thiện cho interns tương lai | 26/03/2026 | 26/03/2026 | [Feedback Form]          |
| 5    | - Hoàn thiện Report <br>&emsp; + Review lần cuối tất cả phần báo cáo <br>&emsp; + Xác minh độ chính xác bilingual content <br>&emsp; + Tạo bản PDF cuối cùng                       | 27/03/2026 | 27/03/2026 | [Final Report]           |
| 6-7  | - Ăn mừng & Wrap-up <br>&emsp; + Team celebration dinner <br>&emsp; + Chuyển giao kiến thức cho cohort tiếp theo <br>&emsp; + Đăng LinkedIn post về trải nghiệm thực tập           | 28/03/2026 | 29/03/2026 | [Photos]                 |

### Thành tựu Tuần 12

* **Final Presentation:**
  * Trình bày NutriTrack thành công cho 15+ stakeholders.
  * Live demo diễn ra suôn sẻ không có vấn đề kỹ thuật.
  * Nhận feedback tuyệt vời về thiết kế serverless architecture.
  * Team NeuraX được xếp hạng trong top 3 projects của cohort.

* **Hoàn thành dự án:**
  * NutriTrack được deploy và hoạt động đầy đủ.
  * Tất cả documentation hoàn chỉnh và bilingual.
  * GitHub repository public với README toàn diện.
  * Workshop sẵn sàng cho người khác làm theo.

* **Phát triển cá nhân:**
  * Thành thạo 10+ AWS services.
  * Có kinh nghiệm phát triển dự án end-to-end.
  * Cải thiện kỹ năng presentation và documentation.
  * Xây dựng network mạnh với các chuyên gia AWS.

### Tổng kết thực tập

**Điểm nổi bật hành trình 12 tuần:**

| Giai đoạn     | Tuần  | Thành tựu chính                                             |
| ------------- | ----- | ----------------------------------------------------------- |
| Nền tảng      | 1-2   | Setup team, AWS basics, thực hành lab, brainstorm idea      |
| Khám phá      | 3-4   | Chọn dự án (NutriTrack), sự kiện AWS re:Invent              |
| Thiết kế      | 5-6   | Nghiên cứu AI pipeline, proposal approved, pivot sang dual-method |
| Nghỉ & Tự học | 7     | Nghỉ Tết, tự học HA architecture, ALB, Auto Scaling         |
| Triển khai    | 8-9   | FastAPI backend, phân tích đồ ăn 2 phương pháp, OCR nhãn, barcode cache 3 tầng |
| Deploy        | 10-11 | ECS Fargate ARM, CI/CD, tối ưu token CSV, cache crawling    |
| Hoàn thiện    | 12    | Private ECS + VPC Endpoints (không NAT), S3 sync, presentation |

**AWS Services đã thành thạo:**
* ECS Fargate (ARM64 + FARGATE_SPOT), ECR, S3, IAM
* VPC, ALB, Target Groups, Auto Scaling (Min=1, Max=10)
* VPC Endpoints: Bedrock Runtime, S3 (Gateway), ECR API/DKR, Secrets Manager, CloudWatch Logs
* Amazon Bedrock (VLM/LLM qua VPC Endpoint)
* Terraform, GitHub Actions CI/CD (6-job pipeline: Scan → Test → Build → Cache Sync → Deploy → Summary)

**Kiến trúc:**
* Internet Gateway → Public Subnets (ALB) → Target Group + Auto Scaling → Private Subnets (ECS Fargate) → VPC Endpoints (Bedrock, S3, ECR, Secrets Manager, CloudWatch)
* **Không NAT Gateway** — 100% private qua VPC Endpoints để tối ưu chi phí
* 2 AZs: private-subnet-ecs01/02 + public-subnet-alb01/02

**Thống kê dự án:**
* 3 API pipelines: /analyze-food (dual-method), /analyze-label (VLM OCR), /scan-barcode (cache 3 tầng)
* Phân tích đồ ăn 2 phương pháp: "manual" (thuần VLM + DB lookup) và "tools" (LLM tool-use với get_batch)
* OCR Nhãn: trích xuất chính xác nutrition facts → 4 bảng CSV (SP, dinh dưỡng, thành phần, dị ứng)
* Barcode: cache L1 LRU RAM (256) → L2 disk JSON → L3 API (Avocavo/OpenFoodFacts/USDA)
* Nén ảnh: 768px, JPEG q75, ép nén > 200KB → tiết kiệm token toàn bộ pipelines
* CSV output format: giảm ~60% tokens so với JSON
* < 100ms thời gian phản hồi API (trả async job qua HTTP 202)
* < 5s bắt đầu xử lý nền

### Nhìn lại cuối cùng

Kỳ thực tập 12 tuần tại AWS Vietnam thông qua chương trình FCJ là một trải nghiệm thực sự biến đổi. Là kỹ sư AI + DevOps + Backend cho Team NeuraX, tôi đã đi từ việc học AWS cơ bản ở Tuần 1 đến việc deploy kiến trúc private ECS hoàn chỉnh với CI/CD tự động và VPC Endpoints ở Tuần 12. Hành trình đã dạy tôi:

1. **Kiến trúc quan trọng hơn code** — chọn private ECS + VPC Endpoints thay vì NAT Gateway giúp tiết kiệm chi phí và giữ kiến trúc an toàn, hoàn toàn private
2. **Tối ưu token là kỹ thuật thực sự** — CSV output (giảm ~60%), nén ảnh (768px), và prompt engineering đều giảm chi phí Bedrock đáng kể
3. **Cache đa tầng là thiết yếu cho AI APIs** — L1 LRU → L2 disk → L3 API giảm latency và API calls đáng kể
4. **Dual-method cho sự linh hoạt** — thuần VLM prompt (nhanh) vs tool-use loop (chính xác) cho user chọn trade-off phù hợp
5. **VPC Endpoints > NAT Gateway** — kết nối private trực tiếp cho Bedrock, S3, ECR, Secrets Manager, CloudWatch không tốn phí NAT

Tôi biết ơn các mentors FCJ, AWS Solution Architects, và các đồng nghiệp Team NeuraX vì đã thúc đẩy tôi phát triển. Kỳ thực tập này không chỉ dạy tôi về cloud — mà dạy tôi cách tư duy như một kỹ sư. Cloud journey vẫn tiếp tục! ☁️🚀
