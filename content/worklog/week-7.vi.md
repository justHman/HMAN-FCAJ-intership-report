### Mục tiêu Tuần 7

* Nghỉ Tết Nguyên Đán — thời gian tự học.
* Tìm hiểu Load Balancer, ALB và Auto Scaling.
* Học Target Groups và cấu hình health check.
* Thiết kế kiến trúc High Availability (HA) cho NutriTrack.

### Các nhiệm vụ thực hiện trong tuần

| Ngày | Nhiệm vụ | Ngày BĐ | Ngày HT | Tài liệu tham khảo |
| --- | --- | --- | --- | --- |
| 1 | - **Nghỉ Tết** (Tết Nguyên Đán) <br>&emsp; + Ngày nghỉ lễ quốc gia <br>&emsp; + Đọc nhẹ tài liệu AWS | 16/02/2026 | 16/02/2026 | - |
| 2-3 | - **Nghỉ Tết** (tiếp tục) <br>&emsp; + Thời gian gia đình và lễ hội <br>&emsp; + Đọc AWS Well-Architected Framework trong lúc rảnh | 17/02/2026 | 18/02/2026 | [Well-Architected](https://docs.aws.amazon.com/wellarchitected/) |
| 4 | - Tự học: Elastic Load Balancing <br>&emsp; + Application Load Balancer (ALB): routing HTTP/HTTPS, path-based routing <br>&emsp; + Network Load Balancer (NLB): TCP/UDP, ultra-low latency <br>&emsp; + So sánh ALB vs NLB cho các use cases khác nhau | 19/02/2026 | 19/02/2026 | [ELB Docs](https://docs.aws.amazon.com/elasticloadbalancing/) |
| 5 | - Tự học: Auto Scaling & Target Groups <br>&emsp; + Auto Scaling policies: target tracking, step scaling, scheduled <br>&emsp; + Target Groups: instance, IP, Lambda targets <br>&emsp; + Health checks: ELB health check vs EC2 status check | 20/02/2026 | 20/02/2026 | [Auto Scaling Docs](https://docs.aws.amazon.com/autoscaling/) |
| 6 | - Thiết kế kiến trúc HA <br>&emsp; + Multi-AZ deployment pattern <br>&emsp; + ALB + Auto Scaling + ECS Fargate cho NutriTrack <br>&emsp; + Thiết kế failover và self-healing mechanisms | 21/02/2026 | 21/02/2026 | [Architecture Notes] |
| 7 | - Chuẩn bị phát triển <br>&emsp; + Setup cấu trúc FastAPI project <br>&emsp; + Cài đặt Python dependencies cho AI/ML <br>&emsp; + Chuẩn bị môi trường cho sprint coding | 22/02/2026 | 22/02/2026 | - |

### Thành tựu Tuần 7

* **Kiến thức Load Balancing:**
  * Hiểu ALB cho HTTP/HTTPS với path-based và host-based routing.
  * Nắm NLB cho TCP/UDP workloads hiệu năng cao.
  * Chọn ALB cho NutriTrack: phù hợp nhất cho REST API routing.

* **Auto Scaling & Target Groups:**
  * Nắm vững các loại Auto Scaling policies và khi nào dùng từng loại.
  * Hiểu Target Groups là cầu nối giữa ALB và backend services.
  * Học cấu hình health check cho service discovery đáng tin cậy.

* **Kiến trúc HA:**
  * Thiết kế Multi-AZ: ALB → Auto Scaling Group → ECS Fargate tasks across 2 AZs.
  * Lên kế hoạch self-healing: task lỗi tự động được thay thế.
  * Ước tính trade-offs chi phí vs availability.

* **Chuẩn bị phát triển:**
  * FastAPI project skeleton sẵn sàng với directory structure chuẩn.
  * Tất cả Python dependencies đã cài đặt và test trên local.

### Khó khăn & Bài học

* **Khó khăn:**
  * Duy trì năng suất trong kỳ nghỉ dài là khó khăn.
  * Hiểu mối quan hệ giữa ALB, Target Groups và Auto Scaling cần nghiên cứu kỹ.

* **Cách giải quyết:**
  * Đặt mục tiêu học nhỏ hàng ngày trong kỳ nghỉ (1-2 giờ đọc tài liệu).
  * Vẽ architecture diagrams để visualize luồng ALB → Target Group → ECS.

* **Bài học rút ra:**
  * HA architecture không chỉ là redundancy — mà là automated recovery.
  * Target Groups là key connector khiến ALB + Auto Scaling hoạt động cùng nhau.

### Kế hoạch Tuần 8

* Bắt đầu phát triển backend: FastAPI với async processing.
* Triển khai JWT authentication cho API security.
* Xây dựng cấu trúc project với i18n support.
* Bắt đầu implement LLM/VLM tool-use loop cho food analysis.
