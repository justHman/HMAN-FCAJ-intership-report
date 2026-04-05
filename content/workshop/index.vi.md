
# NutriTrack — Workshop Triển khai Full-Stack trên AWS

#### Tổng quan

Workshop này cung cấp hướng dẫn chi tiết từng bước để triển khai **NutriTrack** — nền tảng theo dõi dinh dưỡng serverless full-stack trên AWS. Bạn sẽ xây dựng ứng dụng di động React Native (Expo) hỗ trợ bởi **AWS Amplify Gen 2**, **Amazon Bedrock AI** (Qwen3-VL), **AppSync GraphQL**, **DynamoDB**, cùng backend **FastAPI** containerized trên **ECS Fargate**. Hệ thống sử dụng AI để phân tích ảnh đồ ăn, xử lý ghi âm giọng nói, và cung cấp tư vấn dinh dưỡng cá nhân hóa.

#### Nội dung

1. [Tổng Quan](5.1-overview/)
2. [Điều Kiện Tiên Quyết](5.2-prerequisite/)
3. [Giai đoạn 1: Thiết Lập AWS Amplify Gen 2](5.3-foundation/)
4. [Giai đoạn 2: Tầng Dữ Liệu — DynamoDB & GraphQL](5.4-monitoring/)
5. [Giai đoạn 3: Lambda Functions & Tích Hợp AI](5.5-processing/)
6. [Giai đoạn 4: AppSync API & Tính Năng Xã Hội](5.6-automation/)
7. [Giai đoạn 5: Frontend React Native](5.7-dashboard/)
8. [Giai đoạn 6: Triển Khai ECS Fargate Container](5.8-verify/)
9. [Giai đoạn 7: CI/CD & Đa Môi Trường](5.9-cdk/)
10. [Dọn Dẹp](5.10-cleanup/)
11. [Phụ Lục & Tham Khảo](5.11-appendices/)