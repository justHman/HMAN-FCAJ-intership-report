# 4.3.1 Khởi tạo Amplify Gen 2

Amplify Gen 2 là một backend framework theo hướng code-first: bạn khai báo tài nguyên bằng TypeScript, CLI synth thành một CDK app, rồi CloudFormation deploy. Không còn `amplify push`, không còn team-provider file, không còn `aws-exports.js`. Mỗi dev có sandbox stack riêng theo identifier cục bộ, còn CI deploy branch stack mỗi khi push.

Mục này scaffold thư mục `backend/`, cài đúng tập dependencies NutriTrack dùng, và bật sandbox đầu tiên của bạn.

## Cấu trúc thư mục

NutriTrack dùng layout monorepo với frontend và backend là thư mục cùng cấp:

```text
NutriTrack/
├── backend/
│   ├── amplify/
│   │   ├── backend.ts
│   │   ├── auth/resource.ts
│   │   ├── data/resource.ts
│   │   └── storage/resource.ts
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── app/
    └── amplify_outputs.json   # tự sinh, không sửa tay
```

Amplify CLI chỉ đụng vào `backend/`. `amplify_outputs.json` được ghi sang `frontend/` để Expo app import như một module JSON thuần.

## Bước 1: Scaffold dự án

```bash
mkdir NutriTrack && cd NutriTrack
mkdir backend && cd backend
npm create amplify@latest
```

Template `npm create amplify@latest` tạo các file sau trong `backend/`:

| Đường dẫn | Mục đích |
| --- | --- |
| `amplify/backend.ts` | Entry point — gọi `defineBackend(...)` với mọi resource |
| `amplify/auth/resource.ts` | Cấu hình Cognito qua `defineAuth` |
| `amplify/data/resource.ts` | GraphQL schema qua `defineData` (AppSync + DynamoDB) |
| `package.json` | Pin version Amplify + CDK |
| `tsconfig.json` | TypeScript strict, `module: "es2022"` |
| `.gitignore` | Bỏ qua `.amplify/`, `node_modules/`, `amplify_outputs.json` |

Chấp nhận tất cả giá trị mặc định generator đề xuất. Nó không hỏi region — region lấy từ AWS profile lúc chạy `npx ampx sandbox`.

## Bước 2: Cài dependencies

NutriTrack pin một tập dependency cụ thể. Thay `backend/package.json` được sinh ra bằng manifest chính xác dưới đây để các phần sau (Sharp cho resize ảnh, AWS SDK v3 cho Bedrock/Transcribe) compile được:

```json
{
  "name": "nutritrack-backend",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@aws-amplify/backend": "^1.21.0",
    "@aws-amplify/backend-cli": "^1.8.2",
    "@aws-sdk/client-bedrock-runtime": "^3.500.0",
    "@aws-sdk/client-dynamodb": "^3.500.0",
    "@aws-sdk/client-s3": "^3.500.0",
    "@aws-sdk/client-transcribe": "^3.1017.0",
    "@aws-sdk/lib-dynamodb": "^3.500.0",
    "aws-cdk-lib": "^2.234.1",
    "constructs": "^10.0.0",
    "esbuild": "^0.25.0",
    "sharp": "^0.34.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.134",
    "@types/node": "^20.0.0"
  }
}
```

Rồi cài:

```bash
npm install --legacy-peer-deps
```

Flag `--legacy-peer-deps` là bắt buộc. Amplify Gen 2 pin các peer transitive xung đột với bản AWS SDK v3 ở trên; không có flag này `npm` sẽ từ chối resolve. Đây cũng chính là workaround đã enforce trong `frontend/.npmrc`.

## Bước 3: Khung backend.ts

Lúc này `amplify/backend.ts` mới chỉ import `auth` và `data`. Ta sẽ mở rộng nó xuyên suốt phase 4.3 đến 4.5 cho đến khi khớp với backend NutriTrack đầy đủ. Với mục này, giữ nó ở dạng tối thiểu để sandbox đầu tiên deploy nhanh:

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

export const backend = defineBackend({
  auth,
  data,
});
```

Khi workshop kết thúc, `backend.ts` sẽ trông như dưới đây (**đừng** paste ngay — các module import chưa tồn tại cho đến các phần sau):

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { aiEngine } from './ai-engine/resource';
import { processNutrition } from './process-nutrition/resource';
import { friendRequest } from './friend-request/resource';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { storage } from './storage/resource';
import { resizeImage } from './resize-image/resource';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import * as s3 from 'aws-cdk-lib/aws-s3';

const backend = defineBackend({
  auth,
  data,
  aiEngine,
  processNutrition,
  friendRequest,
  storage,
  resizeImage,
});
```

Hãy ghi nhớ target shape này. Mỗi phần sau sẽ thêm đúng một key vào `defineBackend`, cộng với các lời gọi CDK escape-hatch trên `backend.<key>.resources.<construct>`.

## Bước 4: Chạy sandbox

Từ `backend/`:

```bash
npx ampx sandbox
```

Chuyện xảy ra bên dưới:

1. `ampx` đọc `amplify/backend.ts` qua `ts-node`.
2. Synth CDK app vào `.amplify/artifacts/cdk.out/`.
3. Diff với sandbox stack đang deploy (lần đầu: không có).
4. Submit `CreateStack` cho CloudFormation. Tên stack là `amplify-nutritrack-<user-hash>-sandbox-<region-hash>`.
5. Tail CloudFormation event ra terminal cho đến khi `CREATE_COMPLETE`.

Output lần chạy đầu (rút gọn):

```text
[Sandbox] Watching for file changes...
File written: amplify_outputs.json
✔ Deployment completed in 142.37 seconds
```

Lần deploy đầu mất 2–3 phút vì CloudFormation cấp Cognito User Pool, Identity Pool, AppSync API, và một bảng DynamoDB cho mỗi data model. Hot reload lần sau sau mỗi lần save file mất 15–40 giây.

![Sandbox khởi động lần đầu](images/ampx-sandbox-start.png)

Bạn cũng có thể theo dõi tiến độ trong console CloudFormation:

![Tiến độ CloudFormation](images/cfn-progress.png)

Để tiến trình `ampx sandbox` chạy nền. Nó watch `amplify/` và re-deploy khi save. Dừng bằng `Ctrl+C`; dừng **không** teardown stack — chỉ `npx ampx sandbox delete` mới xóa.

## Bước 5: Sinh amplify_outputs.json sang frontend

Sandbox mặc định ghi `amplify_outputs.json` vào `backend/`. Frontend cần nó ở `frontend/`. Chạy lệnh này một lần (và mỗi khi bạn không chạy watcher):

```bash
npx ampx generate outputs --outputs-out-dir ../frontend
```

Kết quả là một file JSON kiểu:

```json
{
  "auth": {
    "user_pool_id": "ap-southeast-2_xxxxxxxx",
    "user_pool_client_id": "xxxxxxxxxxxxxxxxxxxxxxxxxx",
    "identity_pool_id": "ap-southeast-2:xxxx-xxxx",
    "aws_region": "ap-southeast-2"
  },
  "data": {
    "url": "https://xxxxxxxxxxxxxxxxxxxxxxxxxx.appsync-api.ap-southeast-2.amazonaws.com/graphql",
    "aws_region": "ap-southeast-2",
    "default_authorization_type": "AMAZON_COGNITO_USER_POOLS"
  },
  "version": "1.3"
}
```

Không sửa tay file này và không commit — pipeline CI của Amplify sẽ tự sinh cho từng branch.

## Bước 6: Verify

Ba lệnh kiểm tra sandbox đã khỏe:

```bash
# 1. Trạng thái CloudFormation stack
aws cloudformation describe-stacks \
  --stack-name amplify-nutritrack-$(whoami)-sandbox-$(cat .amplify/sandbox-identifier 2>/dev/null || echo '') \
  --query 'Stacks[0].StackStatus' \
  --region ap-southeast-2

# 2. User Pool đã tồn tại
aws cognito-idp list-user-pools --max-results 20 --region ap-southeast-2

# 3. amplify_outputs.json có block auth
node -e "console.log(Object.keys(require('../frontend/amplify_outputs.json')))"
```

Lệnh đầu phải in `CREATE_COMPLETE`, lệnh thứ hai liệt kê pool có tên bắt đầu bằng `amplify-nutritrack`, và lệnh thứ ba in `[ 'auth', 'data', 'version' ]`.

## Troubleshooting

### Sai region

Triệu chứng: sandbox deploy vào `us-east-1` thay vì `ap-southeast-2`.
Nguyên nhân: chưa set `AWS_REGION` / `AWS_DEFAULT_REGION`, hoặc AWS profile có default khác.
Cách sửa:

```bash
export AWS_REGION=ap-southeast-2
export AWS_DEFAULT_REGION=ap-southeast-2
npx ampx sandbox delete   # xóa stack sai region
npx ampx sandbox          # deploy lại
```

### Token SSO hết hạn

Triệu chứng: `ExpiredTokenException: The security token included in the request is expired`.
Cách sửa: đăng nhập SSO lại (`aws sso login --profile <profile>`) rồi khởi động lại `ampx sandbox`. Gen 2 không refresh SSO token giữa chừng.

### "Sandbox already exists for this identifier"

Triệu chứng: `ampx sandbox` không chịu chạy vì một sandbox trước đó từ branch khác đang giữ lock file trong `.amplify/`.
Cách sửa: xóa sandbox cũ hoặc dùng identifier khác.

```bash
npx ampx sandbox delete --identifier old-name
# hoặc
npx ampx sandbox --identifier feature-branch
```

### `sharp` cài lỗi trên Windows

Triệu chứng: `npm install --legacy-peer-deps` lỗi khi tải prebuild của `sharp`.
Cách sửa: cài toolchain build của Windows hoặc dùng WSL2. Workshop này giả định WSL2 Ubuntu 22.04 hoặc macOS.

### CloudFormation rollback ngay lần deploy đầu

Triệu chứng: stack vào trạng thái `ROLLBACK_COMPLETE`.
Cách sửa: đọc lý do lỗi trong console. Thường là do profile thiếu quyền IAM — profile phải tạo được User Pool, IAM role, S3 bucket, Lambda. `AdministratorAccess` (chỉ sandbox) tránh vấn đề này.

Khi mọi kiểm tra pass, tiếp tục [4.3.2 Cognito Auth](../4.3.2-Cognito-Auth/).
