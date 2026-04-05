### Mục tiêu Tuần 5

* Hoàn thiện sơ đồ kiến trúc NutriTrack.
* Thiết lập môi trường phát triển AWS (IAM, S3, DynamoDB).
* Bắt đầu viết tài liệu Proposal để nộp.
* Học API Gateway và Lambda best practices.

### Các nhiệm vụ thực hiện trong tuần

| Ngày | Nhiệm vụ | Ngày BĐ | Ngày HT | Tài liệu tham khảo |
| --- | --- | --- | --- | --- |
| 1 | - Hoàn thiện Architecture <br>&emsp; + Hoàn thành sơ đồ kiến trúc AWS chi tiết <br>&emsp; + Chọn 6 dịch vụ cốt lõi: Cognito, API Gateway, Lambda, DynamoDB, S3, Bedrock | 02/02/2026 | 02/02/2026 | [Architecture v2.0] |
| 2 | - Thiết lập môi trường AWS (Phần 1) <br>&emsp; + Tạo IAM roles với least privilege <br>&emsp; + Set up IAM user development cho team <br>&emsp; + Cấu hình MFA cho tất cả accounts | 03/02/2026 | 03/02/2026 | [IAM Config] |
| 3 | - Thiết lập môi trường AWS (Phần 2) <br>&emsp; + Tạo S3 buckets cho media storage <br>&emsp; + Cấu hình bucket policies và CORS <br>&emsp; + Thiết lập lifecycle rules để tối ưu chi phí | 04/02/2026 | 04/02/2026 | [S3 Buckets] |
| 4 | - Thiết kế DynamoDB <br>&emsp; + Thiết kế schema single-table cho NutriTrack <br>&emsp; + Tạo chiến lược partition key và sort key <br>&emsp; + Thiết lập GSI cho các query patterns | 05/02/2026 | 05/02/2026 | [DynamoDB Schema](https://docs.aws.amazon.com/dynamodb/) |
| 5 | - Nghiên cứu API Gateway & Lambda <br>&emsp; + So sánh REST API vs HTTP API <br>&emsp; + Lambda function best practices <br>&emsp; + Kỹ thuật tối ưu cold start | 06/02/2026 | 06/02/2026 | [API Gateway Docs](https://docs.aws.amazon.com/apigateway/) |
| 6-7 | - Viết tài liệu Proposal <br>&emsp; + Bắt đầu viết NutriTrack Proposal <br>&emsp; + Bao gồm problem statement, objectives, timeline <br>&emsp; + Tạo ước tính ngân sách | 07/02/2026 | 08/02/2026 | [Proposal Draft] |

### Thành tựu Tuần 5

* **Kiến trúc:**
  * Hoàn thành sơ đồ kiến trúc AWS toàn diện với data flow.
  * Chọn dịch vụ dựa trên serverless-first, tiết kiệm chi phí.
  * Kiến trúc được team review và phê duyệt.

* **Môi trường AWS:**
  * IAM roles được cấu hình với Principle of Least Privilege.
  * S3 buckets đã tạo: `nutritrack-media-dev`, `nutritrack-data-dev`.
  * DynamoDB table được thiết kế với single-table pattern cho queries hiệu quả.

* **Tài liệu:**
  * Proposal draft hoàn thành 70% với objectives và timeline rõ ràng.
  * Ước tính timeline phát triển 3 tháng phù hợp với kỳ thực tập.

### Khó khăn & Bài học

* **Khó khăn:**
  * Thiết kế single-table DynamoDB khác với tư duy relational truyền thống.
  * Cân bằng giữa tối ưu chi phí và yêu cầu hiệu năng.

* **Cách giải quyết:**
  * Sử dụng sách DynamoDB của Alex DeBrie và các ví dụ làm tham khảo.
  * Tạo document access patterns trước, sau đó thiết kế schema.

* **Bài học rút ra:**
  * Access patterns phải được định nghĩa trước khi thiết kế DynamoDB schema.
  * On-demand pricing tốt hơn cho development; provisioned cho production.

### Kế hoạch Tuần 6

* Hoàn thành và nộp NutriTrack Proposal để review.
* Bắt đầu triển khai backend: cấu trúc API endpoints.
* Thiết lập môi trường phát triển Lambda với SAM CLI.
* Định nghĩa OpenAPI specification cho NutriTrack APIs.
