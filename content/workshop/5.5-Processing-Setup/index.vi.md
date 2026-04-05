## Giai đoạn 3: Lambda Functions & Tích Hợp AI

Trong giai đoạn này, bạn sẽ xây dựng 4 Lambda functions là xương sống logic backend của NutriTrack, bao gồm AI engine tích hợp Amazon Bedrock Qwen3-VL.

#### Tổng quan Kiến trúc Lambda

| Hàm | Trigger | Mục đích | Dependencies |
|-----|---------|----------|-------------|
| `aiEngine` | AppSync Query | Bộ xử lý AI 10 actions | Bedrock, S3, Transcribe |
| `processNutrition` | AppSync Query | Tra cứu thực phẩm lai ghép | DynamoDB, Bedrock |
| `friendRequest` | AppSync Mutation | Hệ thống xã hội | DynamoDB TransactWriteItems |
| `resizeImage` | S3 Event (incoming/) | Tối ưu hình ảnh | S3, thư viện sharp |

#### Bước 1: AI Engine Lambda

Tạo `backend/amplify/ai-engine/handler.ts` — bộ điều phối AI trung tâm:

```typescript
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({ region: 'ap-southeast-2' });
const MODEL_ID = 'qwen.qwen3-vl-235b-a22b';

export const handler = async (event: any) => {
  const { action, payload } = event.arguments;

  switch (action) {
    case 'analyzeFoodImage':
      return await analyzeFoodImage(payload);
    case 'voiceToFood':
      return await voiceToFood(payload);
    case 'generateRecipe':
      return await generateRecipe(payload);
    // ... 7 actions khác
    default:
      throw new Error(`Action không xác định: ${action}`);
  }
};
```

> 💡 **Quyết định Thiết kế:** Phương pháp lai DynamoDB → Bedrock giảm ~70% chi phí AI, vì phần lớn món ăn Việt Nam phổ biến đã được nạp sẵn trong bảng Food và không cần gọi AI.

#### Bước 2: Process Nutrition Lambda

Tra cứu dinh dưỡng lai ghép: khớp fuzzy trong DynamoDB trước, dự phòng Bedrock AI nếu không tìm thấy.

#### Bước 3: Friend Request Lambda

Hệ thống kết bạn sử dụng DynamoDB TransactWriteItems cho ACID transactions.

#### Bước 4: Resize Image Lambda

S3 event trigger trên prefix `incoming/`, resize về 1024px, chuyển WebP 80% bằng `sharp`.

#### Bước 5: Cấu hình IAM trong backend.ts

Thêm quyền Bedrock, S3, Transcribe cho các Lambda functions trong `backend.ts`.

#### Xác nhận

Sau khi triển khai cả 4 Lambda:

1. Test `aiEngine` qua AppSync console → Gửi query phân tích ảnh
2. Test `processNutrition` → Tìm "phở" (phải trả về kết quả DynamoDB)
3. Upload ảnh vào `incoming/` trên S3 → Xác nhận `resizeImage` xử lý vào `media/`

> 🎯 **Checkpoint:** Cả 4 Lambda đã triển khai và phản hồi. `aiEngine` giao tiếp thành công với Bedrock, upload ảnh trigger resize tự động.
