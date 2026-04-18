Tầng ECS Fargate chạy một FastAPI service được container hóa song song với backend Amplify serverless. Nó xử lý các tác vụ không phù hợp với Lambda như: xử lý dữ liệu kéo dài, suy luận AI tùy chỉnh, hoặc các tiến trình cần duy trì kết nối liên tục.

## Kiến trúc Hệ thống

![Kiến trúc NutriTrack API VPC](images/only-nutritrack-api-vpc.drawio.svg)

Các ECS task chạy trong **Private Subnet** để đảm bảo an ninh; **Application Load Balancer (ALB)** nằm trong **Public Subnet** để tiếp nhận yêu cầu từ internet. Task truy cập vào các dịch vụ AWS khác thông qua **NAT Instance** (giúp tiết kiệm 70% chi phí so với NAT Gateway) hoặc **S3 Gateway Endpoint** (miễn phí).

## Các bước triển khai:

1. [4.5.1 Hạ tầng Mạng (VPC & Network)](4.5.1-VPC-Network/)
2. [4.5.2 Hạ tầng hỗ trợ (S3, Secrets, IAM)](4.5.2-Infrastructure/)
3. [4.5.3 Tối ưu hóa NAT (NAT Instance)](4.5.3-NAT-Instance/)
4. [4.5.4 Triển khai Fargate & ALB](4.5.4-Fargate-ALB/)

---

[Tiếp tục đến 4.6 CI/CD](../4.6-CICD/)
