## Giai đoạn 4: AppSync API & Tính năng Xã hội

Trong giai đoạn này, bạn sẽ cấu hình AppSync GraphQL API resolvers, kết nối Lambda functions làm custom query/mutation resolvers, và triển khai hệ thống kết bạn xã hội.

#### Bước 1: Kết nối Lambda Resolvers với AppSync

Trong `backend/amplify/data/resource.ts`, thêm custom queries và mutations định tuyến đến Lambda:

```typescript
const schema = a.schema({
  // Custom AI query → định tuyến đến aiEngine Lambda
  aiEngine: a.query()
    .arguments({
      action: a.string().required(),
      payload: a.json().required(),
    })
    .returns(a.json())
    .handler(a.handler.function('aiEngine'))
    .authorization((allow) => [allow.authenticated()]),

  // Custom nutrition query → định tuyến đến processNutrition
  processNutrition: a.query()
    .arguments({ foodName: a.string().required(), language: a.string() })
    .returns(a.json())
    .handler(a.handler.function('processNutrition'))
    .authorization((allow) => [allow.authenticated()]),

  // Custom friend mutation → định tuyến đến friendRequest
  friendRequest: a.mutation()
    .arguments({
      action: a.enum(['send', 'accept', 'decline', 'block', 'remove', 'search']),
      userId: a.string().required(),
      targetUserId: a.string(),
      friendCode: a.string(),
    })
    .returns(a.json())
    .handler(a.handler.function('friendRequest'))
    .authorization((allow) => [allow.authenticated()]),
});
```

#### Bước 2: Kiến trúc Hệ thống Kết bạn

Hệ thống kết bạn sử dụng DynamoDB `TransactWriteItems` cho thao tác atomic:

**Luồng Gửi Lời mời:**
1. User A gọi `friendRequest(action: 'send', targetUserId: 'B')`
2. Lambda tạo 2 bản ghi Friendship atomic: A→B (pending, outgoing) và B→A (pending, incoming)

**Luồng Chấp nhận:**
1. User B gọi `friendRequest(action: 'accept', targetUserId: 'A')`
2. Lambda cập nhật cả 2 bản ghi sang `accepted` atomic

#### Bước 3: Chiến lược Phân quyền AppSync

| Chiến lược | Trường hợp sử dụng |
|------------|---------------------|
| **Owner** | Dữ liệu riêng tư (FoodLog, FridgeItem, user) |
| **Authenticated** | Dữ liệu chia sẻ chỉ đọc (Food DB, UserPublicStats) |
| **Custom** | Queries qua Lambda (aiEngine, processNutrition) |

> 🎯 **Checkpoint:** Hệ thống kết bạn hoạt động đầy đủ. Gửi lời mời tạo 2 bản ghi atomic, chấp nhận cập nhật cả hai sang trạng thái 'accepted'.