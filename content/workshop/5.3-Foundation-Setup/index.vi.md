## Giai đoạn 1: Thiết Lập AWS Amplify Gen 2

Trong giai đoạn này, bạn sẽ khởi tạo dự án backend AWS Amplify Gen 2, cấu hình xác thực với Amazon Cognito (bao gồm Google OAuth2), và thiết lập S3 storage với các prefix có tổ chức và lifecycle rules.

#### Bước 1: Khởi tạo Dự án

Tạo thư mục mới và khởi tạo Amplify Gen 2 backend:

```bash
mkdir NutriTrack && cd NutriTrack
mkdir backend && cd backend
npm init -y
npm install @aws-amplify/backend @aws-amplify/backend-cli aws-cdk-lib constructs
```

#### Bước 2: Cấu hình Xác thực (Cognito)

Tạo file auth resource tại `backend/amplify/auth/resource.ts`:

```typescript
import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'NutriTrack - Xác nhận email của bạn',
      verificationEmailBody: (code) => `Mã xác nhận của bạn là: ${code()}`,
    },
    externalProviders: {
      google: {
        clientId: 'YOUR_GOOGLE_CLIENT_ID',
        clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
        scopes: ['email', 'profile', 'openid'],
      },
      callbackUrls: ['nutritrack://callback/', 'http://localhost:8081/'],
      logoutUrls: ['nutritrack://signout/', 'http://localhost:8081/'],
    },
  },
});
```

> 💡 **Ghi chú:** Google OAuth2 credentials lấy từ [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Tạo OAuth 2.0 Client ID cho nền tảng "Web application" và "iOS/Android".

#### Bước 3: Cấu hình S3 Storage

Tạo `backend/amplify/storage/resource.ts`:

```typescript
import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'nutritrackStorage',
  access: (allow) => ({
    'incoming/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
    'voice/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
    'media/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
  }),
});
```

#### Bước 4: Định nghĩa Backend Entry Point

Tạo file chính `backend/amplify/backend.ts`:

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import * as s3 from 'aws-cdk-lib/aws-s3';

const backend = defineBackend({ auth, data, storage });

// Thêm lifecycle rule: tự xóa incoming/ sau 1 ngày
const s3Bucket = backend.storage.resources.bucket;
const cfnBucket = s3Bucket.node.defaultChild as s3.CfnBucket;
cfnBucket.lifecycleConfiguration = {
  rules: [{
    id: 'CleanupIncomingLandingZone',
    status: 'Enabled',
    prefix: 'incoming/',
    expirationInDays: 1,
  }],
};
```

#### Bước 5: Khởi chạy Local Sandbox

Kiểm thử cấu hình trên máy:

```bash
cd backend
npx ampx sandbox
```

Lệnh này sẽ triển khai tất cả tài nguyên lên môi trường sandbox cá nhân. Đầu ra sẽ bao gồm Cognito User Pool ID, AppSync endpoint, và S3 bucket name.

#### Xác nhận

Sau khi sandbox triển khai hoàn tất:

1. Kiểm tra AWS Console → **Cognito** → Xác nhận User Pool đã tạo
2. Kiểm tra **S3** → Xác nhận bucket đã tạo với 3 prefix
3. Kiểm tra file `amplify_outputs.json` cho cấu hình chính xác

> 🎯 **Checkpoint:** Bạn sẽ thấy `✅ Deployment complete` trên terminal, và `amplify_outputs.json` chứa `user_pool_id`, `identity_pool_id`, và `bucket_name`.

Điều hướng đến các mục con bên dưới để thiết lập chi tiết từng thành phần:

- [5.3.1 Thiết lập S3 Buckets](5.3.1-s3-buckets/) — Cấu hình S3 storage với các prefix có tổ chức
- [5.3.2 Cấu hình S3 Policies](5.3.2-s3-policies/) — Thiết lập chính sách truy cập và lifecycle rules
- [5.3.3 IAM Roles & Policies](5.3.3-iam-roles/) — Cấu hình quyền IAM cho Lambda functions