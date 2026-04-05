## Phụ Lục & Tham Khảo

Phần này cung cấp tài liệu tham khảo chi tiết, code snippets, và cấu hình được sử dụng trong workshop NutriTrack 2.0.

#### Phụ lục A: AI Engine — Bảng Tham chiếu Actions

Lambda `aiEngine` hỗ trợ 10 AI actions, tất cả qua một handler duy nhất:

| # | Action | Đầu vào | Đầu ra | Model |
|---|--------|---------|--------|-------|
| 1 | `analyzeFoodImage` | Ảnh Base64 | Tên món, macros (P/C/F/Cal) | Qwen3-VL (vision) |
| 2 | `scanBarcode` | Chuỗi mã vạch | Thông tin sản phẩm + dinh dưỡng | Qwen3-VL |
| 3 | `analyzeLabel` | Ảnh nhãn Base64 | Thông tin dinh dưỡng trích xuất | Qwen3-VL (vision) |
| 4 | `voiceToFood` | Đường dẫn S3 voice | Văn bản + macros | Transcribe → Qwen3-VL |
| 5 | `generateRecipe` | Danh sách nguyên liệu tủ lạnh | Công thức + bước + macros | Qwen3-VL |
| 6 | `generateCoachResponse` | Câu hỏi + context | Phản hồi AI coach "Ollie" | Qwen3-VL |
| 7 | `searchFoodNutrition` | Tên món ăn | Dữ liệu dinh dưỡng (JSON) | Qwen3-VL |
| 8 | `fixFood` | Dữ liệu sai | Dữ liệu đã sửa | Qwen3-VL |
| 9 | `ollieCoachTip` | Thống kê ngày | Mẹo dinh dưỡng cá nhân | Qwen3-VL |
| 10 | `calculateMacros` | Danh sách bữa ăn | Tổng hợp macros | Qwen3-VL |

#### Phụ lục B: Schema Bảng DynamoDB

**Bảng user:** PK: id (Cognito sub) — 18 attributes bao gồm biometrics, gamification, AI preferences.

**Bảng Food:** ~200 món Việt Nam đã nạp sẵn. Owner ghi, authenticated đọc.

**Bảng FoodLog:** GSI trên `logged_at` để truy vấn theo ngày.

#### Phụ lục C: Prompt Engineering Templates

```
Bạn là chuyên gia dinh dưỡng và phân tích đồ ăn Việt Nam. Khi nhận ảnh 
đồ ăn, hãy nhận diện món ăn và cung cấp dữ liệu dinh dưỡng chính xác.

QUY TẮC:
1. Luôn trả lời dạng JSON hợp lệ
2. Sử dụng tên món Việt Nam khi phù hợp  
3. Cung cấp giá trị dinh dưỡng cho mỗi phần ăn
4. Nếu phát hiện nhiều món, liệt kê riêng từng món
5. Bao gồm điểm tin cậy (0-1)
```

#### Phụ lục D: So sánh Giá Bedrock Model

| Khu vực | Input (Standard) | Output (Standard) |
|---------|------------------|-------------------|
| **US East** | $0.00053/1K tokens | $0.00266/1K tokens |
| **Tokyo** | $0.00064/1K tokens | $0.00322/1K tokens |
| **Mumbai** | $0.00062/1K tokens | $0.00313/1K tokens |

**Tính chi phí 1.000 users (90K calls/tháng):**
- Input: 31.5M tokens → $16.70 | Output: 10.8M tokens → $28.73
- **Tổng AI: $45.42/tháng**

#### Phụ lục E: IAM Policies Tham khảo

Bedrock, DynamoDB, Transcribe, S3 policies — xem phiên bản English để có code chi tiết.

#### Phụ lục F: Bảng Chi phí Tổng hợp

| Dịch vụ | Chi phí tháng |
|---------|---------------|
| S3 (storage + transfer + requests) | $2.03 |
| Lambda (requests + compute) | $0.26 |
| API Gateway | $0.34 |
| DynamoDB (storage + RW) | $0.47 |
| Cognito (1K MAU) | $5.50 |
| CloudWatch + CloudTrail | $1.05 |
| Secrets Manager + KMS | $2.20 |
| Textract | $3.60 |
| **Bedrock AI** | **$45.42** |
| **TỔNG** | **$60.87/tháng ($730.44/năm)** |

#### Phụ lục G: Các Lệnh Hữu ích

```bash
# Quản lý Amplify Sandbox
npx ampx sandbox                    # Khởi chạy sandbox local
npx ampx sandbox delete             # Xóa sandbox
npx ampx sandbox secret set KEY     # Đặt secret

# Frontend
cd frontend && npm start            # Khởi chạy Expo dev server
cd frontend && npm test             # Chạy tests

# Docker / ECS
docker build -t nutritrack-api .    # Build container
docker run -p 8000:8000 nutritrack-api  # Chạy local
```