# 4.3.3 S3 Storage

NutriTrack dùng một bucket S3 duy nhất chia theo prefix. Mỗi prefix có policy truy cập riêng, và một prefix (`incoming/`) có lifecycle rule một ngày gắn qua CDK escape hatch. Mục này tạo resource `storage/`, wire vào `backend.ts`, và giải thích vì sao bucket có hình dạng như vậy.

## Vì sao dùng một bucket chia theo prefix

Bốn lý do:

1. **Một cấu hình CORS.** Build web cần CORS cho upload từ trình duyệt; cấu hình trên một bucket đơn giản hơn trên bốn bucket.
2. **Một biên IAM.** Role authenticated của Cognito Identity Pool chỉ cần một tập policy scope theo prefix, thay vì bốn bucket ARN.
3. **Giảm chi phí request S3.** Thao tác cross-prefix (chuyển từ `incoming/` sang `media/`) nằm trong cùng bucket, tránh khác biệt phí `CopyObject`-rồi-`DeleteObject` cross-bucket.
4. **Khớp với mô hình `defineStorage` của Amplify Gen 2.** Một lời gọi, một bucket.

## Bốn prefix

| Prefix | Owner | Mục đích | Vòng đời |
| --- | --- | --- | --- |
| `incoming/{entity_id}/*` | User upload | Landing zone cho ảnh món ăn thô; trigger Lambda `resizeImage` | 1 ngày (lifecycle) |
| `voice/*` | User upload | Bản ghi giọng nói cho Transcribe; Lambda xóa sau khi xong job | Ephemeral (xóa chủ động) |
| `avatar/{entity_id}/*` | Identity-scoped | Ảnh profile user | Vĩnh viễn |
| `media/{entity_id}/*` | Lambda ghi | JPEG đã xử lý (1280px, q85 progressive) | Vĩnh viễn |

`{entity_id}` là Cognito Identity ID của caller đã đăng nhập. Amplify tự resolve cho IAM condition — client không bao giờ tự build path segment này khi dùng `uploadData({ path: 'incoming/...' })` vì storage plugin của Amplify đã substitute giúp.

## Bước 1: Tạo `storage/resource.ts`

```bash
mkdir -p backend/amplify/storage
```

Paste định nghĩa storage chính xác của NutriTrack vào `backend/amplify/storage/resource.ts`:

```typescript
import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'nutritrack_media_bucket',
  access: (allow) => ({
    // Landing Zone — user upload ảnh thô vào đây
    'incoming/{entity_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    // Voice recordings — tạm lưu cho Transcribe xử lý, Lambda xóa sau khi xong
    'voice/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    // Avatar — owner write/delete (scoped theo identity), mọi user đã đăng nhập đều đọc được
    // allow.entity('identity') → IAM condition scoped theo identity của caller (chỉ chủ sở hữu ghi)
    // allow.authenticated read → không scope theo identity → mọi user đã đăng nhập đều xem được
    'avatar/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.authenticated.to(['read']),
    ],
    // Trusted Zone — Lambda ghi kết quả đã xử lý vào đây
    'media/{entity_id}/*': [
      allow.authenticated.to(['read', 'delete'])
    ]
  })
});
```

### Giải thích từng access rule

**`incoming/{entity_id}/*` — authenticated read/write/delete**
Client upload ảnh thô chụp từ camera. Mọi user đã đăng nhập đều có quyền ghi vào bất kỳ path nào dưới `incoming/`, nhưng placeholder `{entity_id}` được storage plugin của Amplify resolve ở client, nên thực tế user chỉ ghi vào thư mục của mình. Lambda resize trigger (4.5.4) chạy khi `ObjectCreated` và đọc từ prefix này.

**`voice/*` — authenticated read/write/delete**
Bản ghi giọng nói cho luồng voice-to-food của `aiEngine`. Không có partition `{entity_id}` vì file voice đặt tên bằng UUID và nằm ở `voice/<uuid>.webm`. AWS Transcribe cần quyền `s3:GetObject` riêng cho prefix này qua một bucket resource policy — điều đó được thêm trong `backend.ts` ở bước kế tiếp và nói kỹ ở 4.5.2.

**`avatar/{entity_id}/*` — ghi scoped theo identity, đọc public**
Chỉ owner mới ghi hoặc xóa avatar của mình. Mọi user đã đăng nhập đều đọc được bất kỳ avatar nào — màn hình danh sách bạn bè cần hiển thị ảnh của bạn, nên không giới hạn đọc theo identity. `allow.entity('identity')` dịch thành IAM condition `${cognito-identity.amazonaws.com:sub}` khớp với path segment.

**`media/{entity_id}/*` — authenticated read/delete**
Lambda `resizeImage` ghi JPEG đã xử lý vào đây. Lưu ý **không** có quyền `write` cho client — client không upload trực tiếp vào `media/`. Chỉ execution role của Lambda (cấp qua `s3Bucket.grantReadWrite(resizeLambda)` trong `backend.ts`) mới ghi được vào prefix này.

## Bước 2: Wire storage vào `backend.ts`

Mở `backend/amplify/backend.ts` và cập nhật để thêm import `storage` cùng với việc đưa vào `defineBackend`. Cuối phase 4.3, `backend.ts` của bạn trông như sau:

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import * as s3 from 'aws-cdk-lib/aws-s3';

const backend = defineBackend({
  auth,
  data,
  storage,
});

// Thêm Lifecycle Rule dọn dẹp 'incoming/' sau 1 ngày (CDK escape hatch)
const s3Bucket = backend.storage.resources.bucket;
const cfnBucket = s3Bucket.node.defaultChild as s3.CfnBucket;
cfnBucket.lifecycleConfiguration = {
  rules: [{
    id: 'CleanupIncomingLandingZone',
    status: 'Enabled',
    prefix: 'incoming/',
    expirationInDays: 1
  }]
};
```

Các IAM grant cho Lambda (`grantReadWrite(resizeLambda)`, quyền Bedrock trên `aiEngineLambda`, resource policy Transcribe) sẽ thêm dần ở các phần sau — đừng paste bây giờ, chúng tham chiếu tới resource chưa tồn tại.

### Vì sao dùng escape hatch

`defineStorage` không expose API lifecycle. Amplify có chủ đích để việc này được thêm qua CDK bằng cách reach vào `backend.storage.resources.bucket`, là một construct `Bucket` tiêu chuẩn từ `aws-cdk-lib/aws-s3`. Từ đó bạn có thể:

- Đọc `s3Bucket.node.defaultChild` để lấy `CfnBucket` bên dưới (construct L1).
- Gán các property mà L2 không expose, ví dụ `lifecycleConfiguration`.

Pattern này — "L2 cho mặc định, L1 cho override" — là cách Amplify Gen 2 khuyến nghị để tinh chỉnh mọi resource được sinh. Bạn sẽ gặp lại ở 4.5 cho biến môi trường Lambda và resource policy Transcribe trên bucket.

## Bước 3: Deploy và verify

Nếu sandbox đang chạy, việc save `backend.ts` sẽ trigger re-deploy. Nếu không:

```bash
npx ampx sandbox
```

Khi `CREATE_COMPLETE`:

```bash
# List buckets — tìm bucket bắt đầu bằng amplify-nutritrack...
aws s3 ls --region ap-southeast-2

# Kiểm tra lifecycle rule đã gắn
BUCKET=$(aws s3 ls --region ap-southeast-2 | grep amplify-nutritrack | awk '{print $3}' | head -1)
aws s3api get-bucket-lifecycle-configuration --bucket "$BUCKET" --region ap-southeast-2
```

Bạn sẽ thấy:

```json
{
  "Rules": [
    {
      "ID": "CleanupIncomingLandingZone",
      "Prefix": "incoming/",
      "Status": "Enabled",
      "Expiration": { "Days": 1 }
    }
  ]
}
```

![S3 bucket trong AWS console](images/s3-bucket-console.png)

![Bốn prefix sau vài lần upload](images/s3-prefixes.png)

## Bước 4: Upload từ frontend

Amplify Storage v6 dùng `uploadData` từ `aws-amplify/storage`. Luồng log món ăn trên frontend lấy Cognito identity ID và ghi vào `incoming/<identity>/<uuid>.jpg`:

```typescript
import { uploadData } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';

async function uploadFoodPhoto(blob: Blob): Promise<string> {
  const session = await fetchAuthSession();
  const identityId = session.identityId;
  if (!identityId) throw new Error('Not authenticated');

  const fileId = crypto.randomUUID();
  const path = `incoming/${identityId}/${fileId}.jpg`;

  await uploadData({
    path,
    data: blob,
    options: { contentType: 'image/jpeg' },
  }).result;

  return path;
}
```

`path` trả về sẽ được truyền vào GraphQL mutation `analyzeFoodImage` ở các phần sau; Lambda `resizeImage` đã ghi bản đã xử lý vào `media/<identity>/<fileId>.jpg` trước khi client query lấy.

## CORS cho build web

Amplify Gen 2 mặc định cấu hình CORS khá mở cho bucket: `AllowedOrigins: ['*']`, `AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD', 'DELETE']`, `AllowedHeaders: ['*']`, `ExposeHeaders: ['x-amz-server-side-encryption', 'x-amz-request-id', 'x-amz-id-2', 'ETag']`. Mức này chấp nhận được với sandbox và phạm vi workshop. Với production, hãy siết `AllowedOrigins` về đúng các domain frontend qua một CDK escape hatch khác trên `cfnBucket.corsConfiguration`.

## Chi phí

Trong toàn bộ workshop, chi phí S3 Standard gần như không đáng kể — vài trăm object nhỏ tổng cộng dưới 100 MB, nằm gọn trong 5 GB Free Tier. Các yếu tố chi phí thật khi 4.5 chạy là:

- **Bedrock Qwen3-VL** theo mỗi 1K token input/output.
- **Transcribe** theo giây-job.
- **Lambda** millisecond-GB cho resize ảnh.
- **DynamoDB** on-demand read/write unit.

Phí request S3 (PUT/GET) chỉ là sai số ở quy mô workshop. Lifecycle rule một ngày trên `incoming/` tồn tại để giữ vệ sinh hơn là tiết kiệm tiền.

## Verify end to end

Với sandbox đang chạy và Expo web dev server bật, đăng nhập và upload một ảnh (hoặc dùng AWS CLI):

```bash
# Tạo file test trong prefix incoming/ của bạn (thay <IDENTITY_ID>)
echo "test" > /tmp/test.txt
aws s3 cp /tmp/test.txt "s3://$BUCKET/incoming/<IDENTITY_ID>/test.txt" --region ap-southeast-2

aws s3 ls "s3://$BUCKET/incoming/<IDENTITY_ID>/" --region ap-southeast-2
```

File sẽ xuất hiện. Sau 24 giờ lifecycle rule sẽ xóa — bạn có thể verify bằng cách xem header `Expires` của object qua `head-object`.

Bucket đã có và đã verify, phase 4.3 hoàn tất. Tiếp tục sang [`../../4.4-Monitoring-Setup/`](../../4.4-Monitoring-Setup/) để wire up GraphQL API và các model DynamoDB.
