# 4.5.2 AIEngine — Lambda Orchestrator 10 Action

`ai-engine` là một Lambda duy nhất xử lý mọi tương tác AI trong NutriTrack. Thay vì một Lambda cho mỗi tính năng (nhân bội cold start và IAM policy), ta gom tất cả vào một orchestrator với switch `action` ở tầng trên. AppSync custom query chuyển tiếp chuỗi `action` và JSON `payload`; handler điều phối đến nhánh tương ứng.

## Định nghĩa resource

```typescript
// backend/amplify/ai-engine/resource.ts
import { defineFunction } from '@aws-amplify/backend';

export const aiEngine = defineFunction({
  name: 'ai-engine',
  entry: './handler.ts',
  runtime: 22,
  memoryMB: 512,
  timeoutSeconds: 120, // voiceToFood: polling Transcribe + Bedrock có thể vượt 60s
});
```

Lý do dùng 120 giây: `voiceToFood` khởi động một Amazon Transcribe job trên file audio tại `s3://{bucket}/voice/...` và poll bằng `GetTranscriptionJob` mỗi 2 giây, tối đa 25 lần (50 giây). Sau khi Transcribe xong, transcript được gửi đến Qwen3-VL, tốn thêm 5–15 giây. Mặc định 60 giây là không đủ.

## Hằng số trong handler

```typescript
const REGION = "ap-southeast-2";
const bedrockClient = new BedrockRuntimeClient({ region: REGION });
const transcribeClient = new TranscribeClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });

const QWEN_MODEL_ID = process.env.QWEN_MODEL_ID || "qwen.qwen3-vl-235b-a22b";
const STORAGE_BUCKET = process.env.STORAGE_BUCKET_NAME || "";
```

- `REGION` được hard-code thành `ap-southeast-2` vì đây là nơi model Bedrock cư trú. Không đọc từ `AWS_REGION` — Lambda có thể chạy ở bất kỳ đâu, nhưng các lệnh gọi Bedrock phải đi về Sydney.
- `QWEN_MODEL_ID` có giá trị mặc định đúng nhưng có thể override qua env var cho A/B test tương lai.
- `STORAGE_BUCKET_NAME` được inject từ `backend.ts` qua CDK escape hatch:

```typescript
// Trong backend.ts
const cfnAiEngineFn = aiEngineLambda.node.defaultChild as cdk.aws_lambda.CfnFunction;
cfnAiEngineFn.addPropertyOverride(
  'Environment.Variables.STORAGE_BUCKET_NAME',
  s3Bucket.bucketName
);
```

## 10 action

Handler điều phối theo `event.arguments.action`. Mỗi nhánh parse `event.arguments.payload` (chuỗi JSON), gọi AWS service, và trả về `JSON.stringify({ success, ... })`.

| Action | Mục đích | Service sử dụng |
| --- | --- | --- |
| `analyzeFoodImage` | Ảnh món ăn → JSON dinh dưỡng có cấu trúc | S3 get, Bedrock (vision) |
| `generateCoachResponse` | Phản hồi hội thoại Ollie với delimiter thẻ | Bedrock (text) |
| `generateFoodNutrition` | Tra cứu tên món khi DB không có | Bedrock (text) |
| `fixFood` | Sửa món đã log theo yêu cầu người dùng | Bedrock (text) |
| `voiceToFood` | Upload âm thanh → transcript → JSON món ăn | Transcribe, S3, Bedrock |
| `ollieCoachTip` | Lời khuyên hàng ngày một câu dựa trên số liệu | Bedrock (text) |
| `generateRecipe` | 1–3 công thức từ inventory tủ lạnh | Bedrock (text) |
| `calculateMacros` | TDEE Mifflin-St Jeor từ số đo cơ thể | Bedrock (text) |
| `challengeSummary` | Blurb bảng xếp hạng | Bedrock (text) |
| `weeklyInsight` | Tóm tắt tiến độ tuần 3 câu | Bedrock (text) |

## System prompt — nhân vật Ollie

Mỗi action đi kèm một system prompt riêng, tất cả bắt đầu với `You are Ollie`. Năm prompt nền tảng:

1. **`GEN_FOOD_SYSTEM_PROMPT`** — dùng bởi `analyzeFoodImage` và `generateFoodNutrition`. Ép ra schema JSON cứng và quy tắc nhất quán calorie `Protein*4 + Carbs*4 + Fat*9 ≈ calories`.
2. **`FIX_FOOD_SYSTEM_PROMPT`** — dùng bởi `fixFood`. Cùng schema đầu ra, `"source": "AI Fixed"`. Tính lại toàn bộ macro khi khối lượng thay đổi.
3. **`VOICE_SYSTEM_PROMPT`** — dùng bởi `voiceToFood` sau Transcribe. Trả về `action: "log" | "clarify"`.
4. **`OLLIE_COACH_SYSTEM_PROMPT`** — dùng bởi `ollieCoachTip`. Tối đa 2 câu, 1–2 emoji, tham chiếu số liệu thực.
5. **`AI_COACH_SYSTEM_PROMPT`** — dùng bởi `generateCoachResponse`. Phát delimiter `===FOOD_CARD_START===` để frontend render thẻ phong phú.

Thêm: `RECIPE_SYSTEM_PROMPT`, `MACRO_CALCULATOR_SYSTEM_PROMPT`, `CHALLENGE_SYSTEM_PROMPT`, `WEEKLY_INSIGHT_SYSTEM_PROMPT`. Toàn bộ được inline ở đầu `handler.ts`.

## Helper gọi Bedrock

```typescript
async function callQwen(messages: any[], maxTokens = 1000): Promise<string> {
  const body = JSON.stringify({ messages, max_tokens: maxTokens });
  const command = new InvokeModelCommand({
    modelId: QWEN_MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body,
  });
  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const text = responseBody.choices?.[0]?.message?.content
    || responseBody.output?.message?.content?.[0]?.text
    || responseBody.content?.[0]?.text
    || '';
  return text;
}
```

Chuỗi fallback tồn tại vì schema response của Bedrock Qwen đã thay đổi qua các phiên bản model. Luôn parse phòng thủ.

## Chi tiết: `analyzeFoodImage`

Tính năng chụp ảnh → phân tích dinh dưỡng. Nhánh handler đầy đủ:

```typescript
if (action === 'analyzeFoodImage') {
  const { s3Key } = data;
  if (!STORAGE_BUCKET) throw new Error('STORAGE_BUCKET_NAME not configured');
  if (!s3Key || s3Key.includes('..')) throw new Error('Invalid s3Key');

  const s3Obj = await s3Client.send(new GetObjectCommand({ Bucket: STORAGE_BUCKET, Key: s3Key }));
  const chunks: Uint8Array[] = [];
  for await (const chunk of s3Obj.Body as any) chunks.push(chunk);
  const base64 = Buffer.concat(chunks).toString('base64');
  const contentType = s3Obj.ContentType || 'image/jpeg';

  const text = await callQwen([
    { role: "system", content: GEN_FOOD_SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:${contentType};base64,${base64}` } },
        { type: "text", text: "Analyze this food image and estimate its nutritional profile. Return ONLY the JSON object." },
      ],
    },
  ]);

  return JSON.stringify({ success: true, text });
}
```

Ghi chú bảo mật: `s3Key.includes('..')` chặn path traversal. Ảnh được encode base64 gửi inline trong payload Bedrock, tránh round trip thứ hai qua AppSync.

## Chi tiết: `voiceToFood` + Transcribe

Nhánh chạy lâu nhất. Luồng đầy đủ:

1. Người dùng ghi âm trong Expo, upload lên `s3://{bucket}/voice/{user}/{uuid}.m4a`.
2. Client gọi `aiEngine` với `action: 'voiceToFood'` và `s3Key`.
3. Lambda khởi động Transcribe job với `LanguageCode: 'vi-VN'` (hard-code — không dùng auto-detect, gây transcript rỗng với WebM).
4. `waitForTranscription()` poll mỗi 2 giây, tối đa 25 lần.
5. Transcript → Qwen với `VOICE_SYSTEM_PROMPT` → JSON food-log.

## Kết nối AppSync

```typescript
// data/resource.ts
aiEngine: a
  .query()
  .arguments({ action: a.string().required(), payload: a.string() })
  .returns(a.string())
  .handler(a.handler.function(aiEngine))
  .authorization((allow) => [allow.authenticated()]),
```

Frontend gọi:

```typescript
const res = await client.queries.aiEngine({
  action: 'analyzeFoodImage',
  payload: JSON.stringify({ s3Key: 'incoming/user-abc/photo-1.jpg' }),
});
const parsed = JSON.parse(res.data ?? '{}');
if (parsed.success) {
  const foodData = JSON.parse(parsed.text); // JSON string từ Qwen
}
```

Double-stringify là cố ý: giữ schema GraphQL đơn giản và tránh retry storm.

## Xử lý lỗi

```typescript
} catch (error: any) {
  debug('Bedrock Lambda Error:', error.message);
  return JSON.stringify({ success: false, error: error.message });
}
```

Lỗi luôn trả về AppSync response thành công với `success: false` — không phải GraphQL error.

Các lỗi thường gặp:

- `STORAGE_BUCKET_NAME not configured` → chạy lại `npx ampx sandbox`.
- `AccessDeniedException` trên Bedrock → chưa được cấp quyền model ở Sydney. Xem [4.5.1](/workshop/4.5.1-Bedrock).
- `ThrottlingException` → vượt quota, SDK retry xử lý.
- `Transcription timed out` → audio format không hợp lệ hoặc quá dài.

## Quan sát

CloudWatch Logs group: `/aws/lambda/amplify-*-ai-engine-*`. Bật `DEBUG=true` để log chi tiết.

![CloudWatch ai-engine logs](images/cloudwatch-ai-logs.png)

## Liên kết

- [4.5.1 Bedrock](/workshop/4.5.1-Bedrock)
- [4.5.3 ProcessNutrition](/workshop/4.5.3-ProcessNutrition)
- [4.5.4 ResizeImage](/workshop/4.5.4-ResizeImage)
