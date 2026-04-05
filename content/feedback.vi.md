# Chia Sẻ và Phản Hồi

## 1. Cảm nhận về chương trình

Chương trình FCJ đã đẩy tôi vượt ra ngoài vùng an toàn. Xây dựng 3 API pipeline hoàn chỉnh — phân tích đồ ăn 2 phương pháp (thuần VLM prompt vs LLM tool-use loop), OCR nhãn trích xuất chính xác bảng nutrition facts thành CSV có cấu trúc, và quét barcode với cache 3 tầng (L1 LRU RAM → L2 disk JSON → L3 API fallback qua USDA, OpenFoodFacts, Avocavo) — tất cả deploy trên kiến trúc private ECS Fargate với VPC Endpoints và không NAT Gateway, là thử thách khó nhưng cực kỳ xứng đáng.

---

## 2. Mức độ hài lòng

Rất hài lòng (9/10). Chương trình cho tự do tối ưu kiến trúc sâu — từ chọn CSV output format giảm ~60% LLM tokens, đến nén ảnh (768px, JPEG q75) tiết kiệm chi phí Bedrock, đến thiết kế VPC hoàn toàn private với VPC Endpoints cho Bedrock Runtime, S3, ECR, Secrets Manager, và CloudWatch thay vì NAT Gateway. Weekly check-ins đủ structure mà vẫn tôn trọng engineering autonomy.

---

## 3. Kiến thức thu được

Trong suốt chương trình, tôi đã có kiến thức sâu về:
- **AWS Private Networking:** VPC 2 AZs, public subnets (ALB) + private subnets (ECS), VPC Endpoints (Bedrock Runtime, S3 Gateway, ECR API/DKR, Secrets Manager, CloudWatch Logs), không NAT Gateway — 100% private egress.
- **Container Hosting:** ECS Fargate (ARM64 + FARGATE_SPOT), Target Groups, Auto Scaling (Min=1, Max=10), ECR image registry.
- **Backend API:** FastAPI với JWT auth (jose, service claim validation), async BackgroundTasks, ThreadPool (AnyIO 100 threads), job store UUID tracking, HTTP 202 immediate response.
- **AI/LLM Tích hợp:** Phân tích đồ ăn 2 phương pháp — (1) "manual" thuần VLM prompt → CSV output → optional USDA cross-validation, (2) "tools" LLM tool-use loop với get_batch tool calling tra cứu USDA batch. OCR Nhãn: OCRER model trích xuất chính xác nutrition facts thành 4 bảng CSV (sản phẩm, dinh dưỡng, thành phần, dị ứng).
- **Tối ưu Token:** CSV output format (giảm ~60% so với JSON), nén ảnh qua prepare_image_for_bedrock() (768px, JPEG q75, ép nén > 200KB), prompt engineering với rules gọn ([ROLE], [TASK], [OUTPUT]).
- **Caching:** Cache barcode 3 tầng (L1 LRU OrderedDict 256 slots → L2 disk JSON files mỗi client → L3 API fallback short-circuit), TTL 30 ngày, negative caching, promotion L2→L1 và L3→L1, S3 cache sync trong CI/CD.
- **CI/CD:** GitHub Actions 6-job pipeline (Security Scan → Test → Build & Push ECR → S3 Cache Sync → Deploy ECS → Summary), Terraform IaC.

---

## 4. Kỹ năng cải thiện

Ngoài kỹ năng kỹ thuật, tôi cải thiện đáng kể khả năng ra quyết định trade-off kiến trúc — chọn private ECS + VPC Endpoints thay NAT Gateway cho chi phí và bảo mật, phân tích đồ ăn dual-method (nhanh vs chính xác), CSV thay JSON để tối ưu token. Kỹ năng thiết kế hệ thống end-to-end phát triển: từ dòng code API đầu tiên đến deploy trong VPC private hoàn chỉnh với ALB và auto-scaling. Tôi cũng có kinh nghiệm sâu về prompt engineering điều khiển chính xác output format VLM/LLM.

---

## 5. Đề xuất cải thiện (cho chương trình)

1. Cần thêm hướng dẫn có cấu trúc trong giai đoạn exploration (Tuần 3-5) — quá nhiều lựa chọn không rõ hướng có thể làm chậm momentum dự án.
2. Cần thêm bài tập tối ưu chi phí thực tế — hiểu giá VPC Endpoints vs NAT Gateway rất quan trọng nhưng ban đầu không rõ ràng.
3. Nên thêm buổi review kiến trúc giữa chương trình với AWS Solution Architects để phát hiện vấn đề thiết kế sớm.

---

## 6. Bạn có giới thiệu chương trình cho bạn bè không? Tại sao?

Chắc chắn rồi. Bạn sẽ xây dựng và deploy hệ thống AI production thật trên AWS, học cách tối ưu token cost và trade-offs kiến trúc, và được mentored bởi AWS Solution Architects. Chương trình bao phủ full stack: từ LLM prompt engineering đến VPC private networking, từ cache design đến CI/CD automation. Với ai muốn trở thành cloud hoặc AI engineer, FCJ internship là một trong những điểm xuất phát tốt nhất.
