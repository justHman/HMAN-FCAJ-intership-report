# Chia Sẻ và Phản Hồi

## 1. Cảm nhận về chương trình

Chương trình thực tập First Cloud AI Journey là một trải nghiệm vô cùng thử thách và bổ ích. Trong 12 tuần qua, tôi đảm nhận các vai trò cốt lõi từ AI Integration, DevOps đến Backend API cho dự án NutriTrack. Chương trình đã đẩy tôi ra khỏi vùng an toàn — từ việc học các dịch vụ AWS cơ bản đến deploy một API production-ready với CI/CD tự động hóa hoàn toàn. Tính thực tiễn cao của chương trình khiến mỗi tuần đều cảm thấy như đang làm việc trong môi trường thực tế, không phải bài tập học thuật.

---

## 2. Mức độ hài lòng

Tôi rất hài lòng với chương trình (9/10). Sự linh hoạt để thử nghiệm các hướng tiếp cận khác nhau — ví dụ chuyển từ multi-model vision pipeline sang LLM tool-use loop — là vô giá. Chương trình có đủ cấu trúc qua weekly check-ins nhưng vẫn cho tự do thử nghiệm với các dịch vụ AWS và chiến lược deployment khác nhau. Điểm duy nhất tôi đánh giá thấp hơn một chút là giai đoạn onboarding ban đầu, có thể cần thêm hướng dẫn hands-on cho các service phức tạp.

---

## 3. Kiến thức đạt được

Trong suốt chương trình, tôi đã lĩnh hội các kiến thức chuyên sâu về:
- **Hạ tầng AWS:** VPC, Subnets, VPC Endpoints, ALB, NAT Gateway, NAT Instance (tối ưu chi phí), Auto Scaling, Target Groups, và ECS Fargate (ARM + Spot).
- **HA & Khả năng mở rộng:** Thiết kế và dựng kiến trúc High Availability với tự động hóa load balancing và auto scaling xuyên nhiều AZs.
- **DevOps & CI/CD:** Pipeline deployment tự động end-to-end sử dụng Terraform, GitHub Actions, triển khai trên cả AWS ECS và Fly.io.
- **API Backend:** Xây dựng API bất đồng bộ bảo mật với FastAPI, JWT authentication, xử lý job nền với ThreadPool, đạt < 100ms response time và < 5s bắt đầu xử lý nền.
- **Tích hợp AI/LLM:** Implement tool-use loop cho LLM/VLM, tối ưu prompt, ép output format CSV giảm tokens (~60%), batch tool calling giảm latency.
- **Caching:** Tự tay xây dựng hệ thống cache 2 tầng (L1 user-level in-memory cache, L2 file-based persistent cache) với cache crawling để pre-populate dữ liệu.

---

## 4. Kỹ năng cải thiện

Ngoài kỹ năng lập trình, tôi đã cải thiện đáng kể khả năng đưa ra quyết định trade-off kiến trúc — ví dụ chọn ECS thay vì Lambda cho AI workloads, hay NAT Instance thay NAT Gateway để tiết kiệm chi phí. Kỹ năng thiết kế hệ thống end-to-end được nâng cao rõ rệt: từ viết dòng code API đầu tiên đến deploy trong private VPC với ALB routing. Tôi cũng tiến bộ trong prompt engineering và hiểu các pattern hành vi của LLM.

---

## 5. Điểm cần cải thiện (cho chương trình)

1. Hướng dẫn có cấu trúc hơn cho giai đoạn exploration ban đầu (Tuần 3-5) — có quá nhiều lựa chọn mà không có định hướng rõ ràng có thể làm chậm tiến độ dự án.
2. Thêm bài tập thực tế về tối ưu chi phí — hiểu AWS pricing rất quan trọng nhưng thường bị bỏ qua vì ưu tiên phát triển tính năng.
3. Cân nhắc thêm buổi review kiến trúc giữa chương trình với AWS Solution Architects.

---

## 6. Bạn có giới thiệu chương trình cho bạn bè không? Tại sao?

Chắc chắn rồi. Chương trình thực tập FCJ mang đến sự kết hợp độc đáo giữa kiến thức AWS lý thuyết và triển khai dự án thực tế mà rất khó tìm thấy ở nơi khác. Bạn sẽ xây dựng và deploy ứng dụng production-grade thực sự trên AWS, làm việc với mô hình AI tiên tiến, và học DevOps practices — tất cả trong một môi trường mentorship hỗ trợ. Với bất kỳ ai quan tâm đến cloud engineering hoặc AI infrastructure, chương trình này là một trong những điểm xuất phát tốt nhất.
