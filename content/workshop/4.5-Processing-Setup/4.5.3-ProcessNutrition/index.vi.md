# 4.5.3 ProcessNutrition — Tra Cứu Dinh Dưỡng Lai Ghép

`process-nutrition` chuyển tên món ăn thành object dinh dưỡng có cấu trúc. Ưu tiên tra cứu bảng DynamoDB `Food` cục bộ trước; chỉ khi không tìm thấy mới gọi Bedrock Qwen3-VL. Với ~200 món Việt đã được seed, đường DynamoDB nhanh và miễn phí. Với món lạ, Bedrock bù vào.

## Định nghĩa resource

```typescript
// backend/amplify/process-nutrition/resource.ts
import { defineFunction } from '@aws-amplify/backend';

export const processNutrition = defineFunction({
  name: 'process-nutrition',
  entry: './handler.ts',
  runtime: 22,
  memoryMB: 512,
  timeoutSeconds: 30,
  resourceGroupName: 'data',
});
```

`resourceGroupName: 'data'` gom Lambda này vào stack data AppSync — tự động nhận IAM để truy cập các bảng DynamoDB.

## Kết nối AppSync

```typescript
// data/resource.ts
processNutrition: a
  .query()
  .arguments({ payload: a.string().required() })
  .returns(a.string())
  .handler(a.handler.function(processNutrition))
  .authorization((allow) => [allow.authenticated()]),
```

`payload` là chuỗi JSON. Hai chế độ:

| `data.action` | Mục đích | Input |
|---|---|---|
| `directSearch` | Tra cứu từ đơn nhanh | `{ action: 'directSearch', query: 'phở bò' }` |
| _(không có)_ | Xử lý mảng nguyên liệu từ AI | `{ items: [ { meal_name, ingredients: [ { name, estimated_g } ] } ] }` |

## Tìm tên bảng

Lambda cần tên bảng lúc runtime. Kiểm tra env var `FOOD_TABLE_NAME` trước; nếu thiếu thì scan `ListTablesCommand` tìm bảng bắt đầu với `Food-`:

```typescript
async function discoverTableName(): Promise<string> {
  if (cachedTableName) return cachedTableName;

  if (process.env.FOOD_TABLE_NAME) {
    cachedTableName = process.env.FOOD_TABLE_NAME;
    return cachedTableName;
  }

  const result = await client.send(new ListTablesCommand({}));
  const foodTable = result.TableNames?.find((name) => name.startsWith('Food-'));
  if (!foodTable) throw new Error('Food table not found in DynamoDB');
  cachedTableName = foodTable;
  return cachedTableName;
}
```

**Vấn đề đã biết**: `ListTablesCommand` trả về bảng từ mọi môi trường Amplify trong cùng AWS account. Khi hai sandbox cùng tồn tại, Lambda có thể chọn nhầm bảng. **Fix**: inject env var trong `backend.ts`:

```typescript
backend.processNutrition.resources.cfnResources.cfnFunction.addPropertyOverride(
  'Environment.Variables.FOOD_TABLE_NAME',
  backend.data.resources.tables['Food'].tableName
);
```

Khi env var được set, đường `ListTablesCommand` không bao giờ được chạy.

## Cache toàn bộ bảng

Handler load tất cả item Food vào bộ nhớ Lambda lần đầu và cache trong suốt vòng đời execution context:

```typescript
let cachedFoods: any[] | null = null;

async function loadAllFoods(): Promise<any[]> {
  if (cachedFoods) return cachedFoods;
  const tableName = await discoverTableName();
  const allItems: any[] = [];
  let lastKey: any;
  do {
    const result = await docClient.send(new ScanCommand({
      TableName: tableName,
      ...(lastKey && { ExclusiveStartKey: lastKey }),
    }));
    if (result.Items) allItems.push(...result.Items);
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);
  cachedFoods = allItems;
  return allItems;
}
```

Ở ~200 item, full scan rất nhỏ. Trên các invocation warm (container tái sử dụng), scan được bỏ qua hoàn toàn.

## Chuẩn hóa văn bản

Tên món Việt có dấu biến thể khi nhập. `normalize()` san phẳng:

```typescript
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // bỏ tất cả dấu
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}
```

`"Phở Bò"` → `"pho bo"`, `"phở bò"` → `"pho bo"`, `"Pho Bo"` → `"pho bo"`. Tất cả đều khớp.

## Fuzzy match 5 tầng

`findBestMatch()` thử match rẻ nhất trước, dừng khi tìm thấy:

```typescript
// Tầng 1: khớp chính xác name_vi
let m = foods.find(f => normalize(f.name_vi) === n);
if (m) return m;

// Tầng 2: khớp chính xác trong mảng aliases_vi
m = foods.find(f => (f.aliases_vi || []).some((a: string) => normalize(a) === n));
if (m) return m;

// Tầng 3: name_vi chứa input HOẶC input chứa name_vi
m = foods.find(f => { const nn = normalize(f.name_vi); return nn.includes(n) || n.includes(nn); });
if (m) return m;

// Tầng 4: alias chứa chuỗi con
m = foods.find(f => (f.aliases_vi || []).some((a: string) => {
  const na = normalize(a); return na.includes(n) || n.includes(na);
}));
if (m) return m;

// Tầng 5: tên tiếng Anh / alias tiếng Anh
m = foods.find(f => { const ne = normalize(f.name_en || ''); return ne.includes(n) || n.includes(ne); });
return m || null;
```

Tầng 5 xử lý input như `"chicken breast"` khớp với record Việt có `name_en: "Chicken Breast"`.

## Đường direct search

Khi `data.action === 'directSearch'`, handler trả về item khớp ngay lập tức:

```typescript
if (data.action === 'directSearch' && data.query) {
  const match = findBestMatch(data.query, allFoods);
  if (match) {
    const defaultG = match.serving?.default_g || 100;
    return JSON.stringify({
      success: true,
      items: [{ meal_name: match.name_vi, ..., db_match_count: 1, ai_fallback_count: 0 }],
    });
  }
  // Không tìm thấy → client gọi aiEngine
  return JSON.stringify({ success: false, error: 'Not found in DB direct search' });
}
```

## Đường bình thường — xử lý mảng nguyên liệu

Khi client truyền bữa ăn nhiều nguyên liệu từ output AI, mỗi nguyên liệu qua `findBestMatch`. Item khớp dùng macro per-100g của bảng `Food` scale theo `estimated_g`; item không khớp dùng giá trị AI ước lượng:

```typescript
function calculateNutrition(dbFood: any, estimatedG: number) {
  const ratio = estimatedG / 100;
  return {
    calories:  Math.round((dbFood.macros?.calories  || 0) * ratio * 10) / 10,
    protein_g: Math.round((dbFood.macros?.protein_g || 0) * ratio * 10) / 10,
    carbs_g:   Math.round((dbFood.macros?.carbs_g   || 0) * ratio * 10) / 10,
    fat_g:     Math.round((dbFood.macros?.fat_g     || 0) * ratio * 10) / 10,
  };
}
```

Response cuối có `db_match_count` và `ai_fallback_count` để UI hiển thị mức độ tin cậy.

## Yêu cầu IAM

Lambda role cần:
- `dynamodb:Scan`, `dynamodb:GetItem`, `dynamodb:Query` trên bảng `Food-*`.
- `dynamodb:ListTables` — chỉ nếu chưa loại bỏ đường `discoverTableName()`.

Không cần quyền Bedrock — Lambda này không gọi Bedrock trực tiếp.

## Kiểm thử

Chạy `npx ampx sandbox` từ `backend/`, sau đó dùng AppSync console:

```graphql
query {
  processNutrition(payload: "{\"action\":\"directSearch\",\"query\":\"phở bò\"}")
}
```

Kết quả mong đợi: `{"success":true,"items":[{"meal_name":"Phở bò",...}]}`.

Với món không có trong DB:

```graphql
query {
  processNutrition(payload: "{\"action\":\"directSearch\",\"query\":\"wagyu ribeye\"}")
}
```

Kết quả: `{"success":false,"error":"Not found in DB direct search"}` — client sau đó gọi `aiEngine`.

## Mô hình chi phí

- DynamoDB `Scan` lần đầu cold: ~1 RCU per KB. 200 item × ~2 KB ≈ 400 KB → ~4 RCU lần đầu mỗi container. Warm invocation: 0 RCU (cache in-memory).
- Không gọi Bedrock — chi phí rất thấp.

## Liên kết

- [4.4.2 DynamoDB](/workshop/4.4.2-DynamoDB) — schema bảng Food và seed data.
- [4.5.2 AIEngine](/workshop/4.5.2-AIEngine) — Bedrock fallback cho món không nhận dạng được.
- [4.5 Compute & AI](/workshop/4.5-Processing-Setup) — tổng quan section.
