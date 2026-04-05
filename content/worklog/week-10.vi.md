### Mục tiêu Tuần 10

* Deploy NutriTrack API lên ECS Fargate ARM + Spot instances.
* Implement label detection pipeline cho ảnh sản phẩm.
* Xây dựng barcode scanning pipeline với 3 nutrition API clients.
* Viết tests toàn diện cho tất cả pipelines và API endpoints.

### Các nhiệm vụ thực hiện trong tuần

| Ngày | Nhiệm vụ | Ngày BĐ | Ngày HT | Tài liệu tham khảo |
| --- | --- | --- | --- | --- |
| 1 | - Deploy ECS Fargate <br>&emsp; + Deploy API pipeline lên ECS Fargate ARM + Spot <br>&emsp; + Deploy API pipeline lên App Runner (so sánh) <br>&emsp; + Cấu hình task definitions và service settings | 10/03/2026 | 10/03/2026 | [ECS Docs](https://docs.aws.amazon.com/ecs/) |
| 2 | - Label Detection Scripts <br>&emsp; + Viết scripts phát hiện nhãn dinh dưỡng từ ảnh sản phẩm <br>&emsp; + Tạo API endpoint cho label detection <br>&emsp; + Tích hợp VLM model cho label text extraction | 11/03/2026 | 11/03/2026 | [Label Detection Code] |
| 3 | - Test & Deploy Label Detection <br>&emsp; + Test scripts và API cho label detection <br>&emsp; + Deploy label detection pipeline lên AWS <br>&emsp; + Fix lỗi xử lý image format | 12/03/2026 | 12/03/2026 | [Test Reports] |
| 4 | - Barcode Client Scripts <br>&emsp; + Viết script cho OpenFoodFacts API client <br>&emsp; + Viết script cho Avocavo Nutrition API client <br>&emsp; + Viết script cho USDA FoodData Central client | 13/03/2026 | 13/03/2026 | [Client Scripts] |
| 5 | - Client Testing <br>&emsp; + Viết tests cho OpenFoodFacts client <br>&emsp; + Viết tests cho Avocavo Nutrition client <br>&emsp; + Chuẩn hóa mock data cho DEMO_KEY fallback | 14/03/2026 | 14/03/2026 | [Test Suite] |
| 6-7 | - Tích hợp Barcode Pipeline <br>&emsp; + Đồng bộ barcode output format cho 3 clients <br>&emsp; + Xây dựng end-to-end pipeline: detect barcode → search food → return nutrition <br>&emsp; + Tạo API endpoint và viết tests toàn diện <br>&emsp; + Tất cả tests pass | 15/03/2026 | 15/03/2026 | [Pipeline Tests] |

### Thành tựu Tuần 10

* **Deploy ECS:**
  * API deploy thành công lên ECS Fargate ARM + Spot (tối ưu chi phí).
  * So sánh ECS Fargate vs App Runner — chọn ECS để control networking tốt hơn.
  * Container chạy trên ARM architecture cho price/performance tốt hơn.

* **Label Detection Pipeline:**
  * Pipeline hoàn chỉnh: image → VLM trích xuất text nhãn → parse nutrition facts.
  * API endpoint hoạt động với < 5s processing time.
  * Xử lý được nhiều image formats và quality levels khác nhau.

* **Barcode Pipeline:**
  * 3 API clients: OpenFoodFacts, USDA, Avocavo Nutrition.
  * Chuẩn hóa output format cho cả 3 clients để kết quả nhất quán.
  * Pipeline hoàn chỉnh: scan barcode → search 3 databases → merge results.
  * Test suite toàn diện với mock data fallback cho DEMO_KEY.

* **Testing:**
  * Tất cả pipeline tests passing.
  * Mock data system cho testing không cần API keys thật.

### Khó khăn & Bài học

* **Khó khăn:**
  * Mỗi nutrition API trả dữ liệu format hoàn toàn khác nhau — chuẩn hóa rất phức tạp.
  * ECS Fargate ARM images cần Docker builds multi-architecture.
  * Image format handling gây lỗi không mong muốn (ví dụ: palette mode 'P' không save được JPEG).

* **Cách giải quyết:**
  * Tạo unified data transformer cho mỗi client để normalize output.
  * Dùng Docker buildx cho multi-arch builds (AMD64 + ARM64).
  * Thêm chuyển đổi image mode (P → RGB/RGBA) trước khi nén.

* **Bài học rút ra:**
  * ARM-based Fargate instances tiết kiệm ~20% chi phí so với x86.
  * Chuẩn hóa output API client sớm tránh đau đầu khi tích hợp sau.
  * Image processing cần xử lý format toàn diện — không bao giờ giả định input format.

### Kế hoạch Tuần 11

* Thiết lập CI/CD pipeline với GitHub Actions cho automated ECS deployment.
* Tối ưu prompt engineering để giảm token usage và chi phí.
* Implement cache crawling cho pre-populating nutrition data.
* Bắt đầu Terraform infrastructure-as-code cho deployments reproducible.
