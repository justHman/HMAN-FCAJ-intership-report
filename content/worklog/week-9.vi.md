### Mục tiêu Tuần 9

* Commit đầu tiên lên GitHub.
* Implement pipeline OCR nhãn (trích xuất bảng thành phần dinh dưỡng).
* Xây dựng pipeline quét barcode với cache đa tầng.
* Tạo Dockerfile và Gradio web UI.

### Công việc thực hiện trong tuần

| Ngày | Công việc | Ngày bắt đầu | Ngày hoàn thành | Tài liệu tham khảo |
| --- | --- | --- | --- | --- |
| 1 | - Commit đầu tiên <br>&emsp; + Commit chính thức: project với i18n và API <br>&emsp; + Cấu hình .env và environment <br>&emsp; + Push lên GitHub repository | 03/03/2026 | 03/03/2026 | [GitHub Repo](https://github.com/NeuraX-HQ) |
| 2 | - Pipeline OCR Nhãn <br>&emsp; + Xây /analyze-label endpoint — VLM trích xuất chính xác nutrition facts từ ảnh sản phẩm <br>&emsp; + OCRER model xuất 4 bảng CSV: thông tin SP, dinh dưỡng, thành phần, dị ứng <br>&emsp; + Prompt engineering: CSV format nghiêm ngặt với pipe delimiters <br>&emsp; + Cùng async pattern: HTTP 202 → background job → poll /jobs/{id} | 05/03/2026 | 05/03/2026 | [Label Analyzer] |
| 3 | - Pipeline Quét Barcode (Phần 1) <br>&emsp; + Xây /scan-barcode endpoint với pyrxing barcode decoder <br>&emsp; + Thiết kế cache 3 tầng: L1 LRU RAM (256 slots) → L2 disk JSON → L3 API fallback <br>&emsp; + L2 disk lookup: OpenFoodFacts → Avocavo → USDA <br>&emsp; + L3 API search: Avocavo → OpenFoodFacts → USDA (hit đầu tiên short-circuit) | 06/03/2026 | 06/03/2026 | [Cache Design] |
| 4 | - Pipeline Quét Barcode (Phần 2) <br>&emsp; + Cache TTL: 30 ngày, entry hết hạn trigger L3 API refresh <br>&emsp; + L1→L2 promotion khi hit, L3→L1 promotion khi API thành công <br>&emsp; + Negative cache: cache kết quả "not found" tránh gọi API thừa <br>&emsp; + 3 API clients output format chuẩn hóa | 07/03/2026 | 07/03/2026 | [Client Scripts] |
| 5 | - Gradio Web UI & Dockerfile <br>&emsp; + Build Gradio UI demo phân tích đồ ăn và OCR nhãn <br>&emsp; + Hỗ trợ chọn method "manual" hoặc "tools" <br>&emsp; + Tạo Dockerfile cho deployment <br>&emsp; + Nén ảnh trong tất cả pipelines: 768px, JPEG q75 | 08/03/2026 | 08/03/2026 | [Gradio Demo] |
| 6-7 | - Phát hiện Nhiều Đồ ăn & Testing <br>&emsp; + Mở rộng phân tích phát hiện nhiều món trong 1 ảnh <br>&emsp; + Thống nhất output format giữa tool-use và manual <br>&emsp; + Viết tests cho cả 3 pipeline endpoints <br>&emsp; + Sửa lỗi image format (P→RGB conversion) | 08/03/2026 | 08/03/2026 | [Test Suite] |

### Thành tựu Tuần 9

* **Pipeline OCR Nhãn:**
  * Pipeline hoàn chỉnh: ảnh → VLM (OCRER model) → trích xuất chính xác nutrition facts → dữ liệu có cấu trúc.
  * Xuất 4 bảng CSV: thông tin SP (tên, thương hiệu, khẩu phần), dinh dưỡng (giá trị mỗi phần), danh sách thành phần, chất gây dị ứng.
  * Prompt tối ưu CSV format — cùng chiến lược giảm token.

* **Barcode Cache 3 Tầng:**
  * **L1 (RAM):** LRU cache với OrderedDict, tối đa 256 slots, Thread-safe.
  * **L2 (Disk):** JSON files mỗi client (openfoodfacts_cache.json, avocavo_cache.json, usda_cache.json), TTL 30 ngày.
  * **L3 (API):** Fallback gọi API — Avocavo → OpenFoodFacts → USDA, hit đầu tiên short-circuit.
  * Promotion: L2 hit → đẩy lên L1, L3 hit → đẩy lên L1.
  * Negative cache: cache kết quả "not found" tránh lookup thừa.

* **Nén Ảnh:**
  * `prepare_image_for_bedrock()`: resize 768px, JPEG q75, ép nén nếu > 200KB hoặc > max_pixels.
  * Auto-convert image modes (P, RGBA, L → RGB) trước JPEG compression.
  * Áp dụng cho cả 3 pipelines để tiết kiệm token đồng nhất.

* **Containerization:**
  * Dockerfile sẵn sàng deploy.
  * Gradio demo UI test tương tác không cần frontend riêng.

### Thử thách & Bài học

* **Thử thách:**
  * Label OCR cần trích xuất chính xác giá trị dinh dưỡng — VLM đôi khi hallucinate hoặc merge fields.
  * Cache design: xử lý negative results, expired entries, multi-source fallback.
  * Image format: palette mode 'P' không thể save JPEG trực tiếp.

* **Giải pháp:**
  * Strict CSV prompt với example rows — VLM follow format chính xác.
  * Negative caching và TTL expiry với auto L3 refresh.
  * Auto-convert image mode sang RGB trước JPEG.

* **Bài học:**
  * Cache 3 tầng hiệu quả hơn nhiều so với cache in-memory đơn giản — L2 disk persist qua restart.
  * Negative caching ngăn gọi API thất bại lặp lại — quan trọng cho barcode databases.
  * CSV format trong prompts cho output nhất quán hơn JSON.

### Kế hoạch Tuần sau

* Deploy API lên ECS Fargate ARM + Spot.
* Hoàn thiện cả 3 pipelines (/analyze-food, /analyze-label, /scan-barcode).
* Xây 3 nutrition API clients (USDA, OpenFoodFacts, Avocavo) với tests.
* Viết comprehensive tests cho tất cả endpoints.
