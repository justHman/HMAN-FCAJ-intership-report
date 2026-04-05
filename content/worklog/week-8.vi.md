### Mục tiêu Tuần 8

* Bắt đầu phát triển backend với FastAPI.
* Implement JWT authentication cho bảo mật API.
* Xây dựng phân tích đồ ăn 2 phương pháp: (1) "manual" — thuần VLM prompt + tra cứu USDA, (2) "tools" — LLM tool-use loop với get_batch.
* Implement nén ảnh để tối ưu token.

### Công việc thực hiện trong tuần

| Ngày | Công việc | Ngày bắt đầu | Ngày hoàn thành | Tài liệu tham khảo |
| --- | --- | --- | --- | --- |
| 1 | - Thiết lập dự án FastAPI <br>&emsp; + Khởi tạo project với hỗ trợ i18n (Tiếng Việt & Tiếng Anh) <br>&emsp; + Cấu trúc project: routes, models, services <br>&emsp; + Thiết lập biến môi trường và file .env | 23/02/2026 | 23/02/2026 | [FastAPI Docs](https://fastapi.tiangolo.com/) |
| 2 | - JWT Authentication <br>&emsp; + JWT token generation và validation bằng thư viện jose <br>&emsp; + API key middleware cho xác thực request <br>&emsp; + Bảo vệ endpoint với kiểm tra service claim | 24/02/2026 | 24/02/2026 | [JWT Docs] |
| 3 | - Kiến trúc Backend Async <br>&emsp; + Thiết kế xử lý async với BackgroundTasks <br>&emsp; + ThreadPool (AnyIO 100 threads) cho AI inference đồng thời <br>&emsp; + Hệ thống job ID (UUID) theo dõi background tasks <br>&emsp; + Auto cleanup jobs cũ khi store vượt 1000 | 25/02/2026 | 25/02/2026 | [AsyncIO Docs] |
| 4 | - Thiết kế Phân tích Đồ ăn 2 Phương pháp <br>&emsp; + Method 1 "manual": Thuần VLM prompt → CSV output (bảng dishes + bảng ingredients) <br>&emsp; + Method 2 "tools": LLM tool-use loop với get_batch tool calling tra cứu USDA batch <br>&emsp; + Thiết kế prompt_config.py với CSV output format nghiêm ngặt để giảm token <br>&emsp; + Nén ảnh (768px, JPEG q75) qua prepare_image_for_bedrock() | 26/02/2026 | 26/02/2026 | [Bedrock Tool Use](https://docs.aws.amazon.com/bedrock/) |
| 5 | - Phát triển API Endpoints <br>&emsp; + Tạo /analyze-food endpoint với ?method=tools|manual query param <br>&emsp; + Thời gian response: < 100ms (trả job ID ngay qua HTTP 202) <br>&emsp; + Background processing qua run_in_threadpool cho AI inference nặng | 27/02/2026 | 27/02/2026 | [API Design] |
| 6-7 | - Kiểm thử & tinh chỉnh <br>&emsp; + Viết test suite cho API endpoints <br>&emsp; + Kiểm tra cơ chế polling job async <br>&emsp; + Sửa edge cases trong tool-use loop (max_tool_rounds=1) | 28/02/2026 | 01/03/2026 | [Test Suite] |

### Thành tựu Tuần 8

* **Backend API:**
  * FastAPI project với cấu trúc chuẩn và hỗ trợ i18n.
  * API response **< 100ms** (trả job ID ngay qua HTTP 202).
  * Background processing < 5 giây với ThreadPool (AnyIO 100 threads).

* **Phân tích Đồ ăn 2 Phương pháp:**
  * **Phương pháp 1 "manual":** Thuần VLM prompt phân tích ảnh → xuất 2 bảng CSV (dishes + ingredients) với name, weight, calories, protein, carbs, fat, confidence, cooking_method → có thể cross-validate với USDA.
  * **Phương pháp 2 "tools":** LLM tool-use loop — model nhìn ảnh → gọi `get_batch` tool với danh sách đồ ăn và trọng lượng → tool trả dữ liệu dinh dưỡng từ USDA → model điều chỉnh và xuất CSV cuối cùng.
  * Cả 2 phương pháp dùng chung output format (FoodList schema).

* **Tối ưu Token:**
  * CSV output format trong prompts — 2 bảng nghiêm ngặt với pipe delimiters, không text thừa.
  * Nén ảnh qua `prepare_image_for_bedrock()`: resize 768px, JPEG q75, ép nén nếu > 200KB.
  * Prompt engineering: system prompt tối giản với rules gọn (`[ROLE]`, `[TASK]`, `[OUTPUT]`).

* **Authentication:**
  * JWT authentication với jose — validate service claim = "backend".
  * HTTP middleware bảo vệ /analyze-food, /analyze-label, /scan-barcode, /jobs/ endpoints.

### Thử thách & Bài học

* **Thử thách:**
  * Quản lý async tasks với error handling và timeout phức tạp.
  * Tool-use loop có thể loop vô hạn nếu model không converge.
  * Image format: các mode khác nhau (P, RGBA, L) có thể crash JPEG compression.

* **Giải pháp:**
  * max_tool_rounds=1 để ngăn infinite loops.
  * Error handling và job status tracking cho failed tasks.
  * Auto-convert image mode: P/RGBA → RGB trước JPEG compression.

* **Bài học:**
  * CSV output format giảm token đáng kể so với JSON (~60% savings).
  * Nén ảnh rất quan trọng — ảnh lớn lãng phí token trong vision models.
  * Dual-method cho user linh hoạt: nhanh (manual) vs chính xác (tools).

### Kế hoạch Tuần sau

* Commit đầu tiên lên GitHub với toàn bộ project.
* Xây dựng Gradio web UI để demo và test.
* Implement pipeline OCR nhãn dinh dưỡng.
* Tạo Dockerfile cho containerized deployment.
