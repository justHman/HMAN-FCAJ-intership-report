## Giai đoạn 2: Tầng Dữ Liệu — DynamoDB & GraphQL Schema

Trong giai đoạn này, bạn sẽ định nghĩa toàn bộ schema GraphQL cho tầng dữ liệu của NutriTrack. AWS Amplify Gen 2 sử dụng TypeScript CDK để định nghĩa data models, tự động cấp phát bảng DynamoDB với AppSync resolvers.

#### Bước 1: Tạo Data Schema

Tạo `backend/amplify/data/resource.ts` với đầy đủ 8 data models:

```typescript
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Cơ sở dữ liệu dinh dưỡng (~200 món ăn Việt Nam)
  Food: a.model({
    name: a.string().required(),
    name_vi: a.string(),
    calories: a.float().required(),
    protein: a.float().required(),
    carbs: a.float().required(),
    fat: a.float().required(),
    fiber: a.float(),
    serving_size: a.string(),
    category: a.string(),
    image_url: a.string(),
    source: a.enum(['manual', 'ai_generated', 'verified']),
  }).authorization((allow) => [
    allow.authenticated().to(['read']),
    allow.owner().to(['create', 'update', 'delete']),
  ]),

  // Hồ sơ người dùng với gamification, sinh trắc học, cài đặt AI
  user: a.model({
    email: a.email().required(),
    display_name: a.string(),
    avatar_url: a.string(),
    height_cm: a.float(),
    weight_kg: a.float(),
    age: a.integer(),
    gender: a.enum(['male', 'female', 'other']),
    activity_level: a.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
    daily_calories: a.integer(),
    daily_protein: a.float(),
    daily_carbs: a.float(),
    daily_fat: a.float(),
    streak_count: a.integer().default(0),
    pet_level: a.integer().default(1),
    total_xp: a.integer().default(0),
    friend_code: a.string(),
    ai_preferences: a.json(),
    language: a.enum(['en', 'vi']),
  }).authorization((allow) => [allow.owner()]),

  // ...các model còn lại tương tự phiên bản English
});
```

#### Bước 2: Hiểu Mô hình Dữ liệu

| Model | Mục đích | Phân quyền | Index |
|-------|----------|------------|-------|
| `Food` | DB dinh dưỡng Việt Nam (~200 món) | Owner ghi, authenticated đọc | — |
| `user` | Hồ sơ + sinh trắc + gamification | Chỉ owner | — |
| `FoodLog` | Nhật ký bữa ăn hàng ngày | Chỉ owner | `logged_at` GSI |
| `FridgeItem` | Quản lý tủ lạnh/bếp | Chỉ owner | — |
| `Challenge` | Định nghĩa thử thách nhóm | Owner ghi, authenticated đọc | — |
| `ChallengeParticipant` | Tham gia thử thách | Chỉ owner | `challengeId` |
| `Friendship` | Bản ghi kết bạn (hai chiều) | Chỉ owner | `friend_id` GSI |
| `UserPublicStats` | Dữ liệu bảng xếp hạng | Owner ghi, authenticated đọc | — |

#### Bước 3: Triển khai và Xác nhận

Sau khi thêm data schema vào sandbox:

```bash
npx ampx sandbox
```

Xác nhận trong AWS Console:
1. Đến **DynamoDB** → Kiểm tra 8 bảng đã được tạo
2. Đến **AppSync** → Kiểm tra GraphQL API có đầy đủ models, queries, mutations
3. Test một mutation bằng AppSync console query editor

> 🎯 **Checkpoint:** Tất cả 8 bảng DynamoDB phải hiển thị trong console, và bạn có thể chạy thành công mutation `createUser` từ AppSync query editor.
