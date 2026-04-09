# 4.5.4 ResizeImage — Lambda Xử Lý Ảnh S3

`resize-image` là Lambda được kích hoạt bởi S3. Mỗi khi một object được tạo dưới prefix `incoming/`, S3 bắn event, Lambda đọc upload thô, resize về tối đa 1280 px theo cạnh dài nhất, và ghi JPEG progressive ở chất lượng 85 vào `media/{entityId}/{baseName}.jpg`. Lambda **không** xóa file nguồn — lifecycle rule S3 1 ngày trên `incoming/` tự dọn dẹp.

## Định nghĩa resource

```typescript
// backend/amplify/resize-image/resource.ts
import { defineFunction } from '@aws-amplify/backend';

export const resizeImage = defineFunction({
  name: 'resize-image',
  entry: './handler.ts',
  runtime: 22,
  memoryMB: 512,
  resourceGroupName: 'storage',
});
```

`resourceGroupName: 'storage'` gắn Lambda này vào stack storage. Không có entry AppSync — chỉ được gọi bởi S3 event notification.

## Kết nối trigger S3

Trong `backend.ts`:

```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';

const s3Bucket = backend.storage.resources.bucket;
const resizeLambda = backend.resizeImage.resources.lambda;

s3Bucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new LambdaDestination(resizeLambda),
  { prefix: 'incoming/' }
);
```

Filter `{ prefix: 'incoming/' }` đảm bảo chỉ object upload vào `incoming/` mới kích hoạt event. Object ghi vào `media/`, `voice/`, `avatar/` bị bỏ qua.

## Hướng dẫn handler

```typescript
// Hằng số chính
const MAX_DIMENSION = 1280; // px, cạnh dài nhất
const JPEG_QUALITY = 85;
```

Với mỗi S3 record trong event:

### Bước 1 — Parse key

```typescript
// Định dạng: incoming/{entity_id}/{filename}
const parts = key.split('/');
const entityId = parts.slice(1, parts.length - 1).join('/');
const originalFilename = parts[parts.length - 1];
const baseName = originalFilename.replace(/\.[^.]+$/, ''); // bỏ extension
const destKey = `media/${entityId}/${baseName}.jpg`;
```

`entityId` là tất cả giữa `incoming/` và filename. Ví dụ key `incoming/us-east-1:abc123/photo.jpg` → `entityId = us-east-1:abc123`, `destKey = media/us-east-1:abc123/photo.jpg`.

### Bước 2 — Validate content type

```typescript
const head = await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
const contentType = head.ContentType || '';
if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(contentType)) {
  console.error(`Unsupported content type: ${contentType} for ${key}`);
  continue;
}
```

Upload không phải ảnh bị bỏ qua với log cảnh báo, không throw exception (tránh retry event).

### Bước 3 — Resize với sharp

```typescript
const resizedBuffer = await sharp(originalBuffer)
  .rotate()                          // tự xoay theo EXIF orientation
  .resize(MAX_DIMENSION, MAX_DIMENSION, {
    fit: 'inside',                   // giữ tỷ lệ khung hình
    withoutEnlargement: true,        // không phóng to ảnh nhỏ
  })
  .jpeg({ quality: JPEG_QUALITY, progressive: true })
  .toBuffer();
```

- `.rotate()` sửa ảnh portrait chụp bằng điện thoại lưu orientation trong EXIF. Nếu thiếu, ảnh bị nghiêng.
- `fit: 'inside'` scale ảnh để không chiều nào vượt 1280 px, giữ tỷ lệ gốc.
- `withoutEnlargement: true` giữ nguyên ảnh nhỏ hơn 1280 px.
- `progressive: true` tạo JPEG xen kẽ, render dần trong trình duyệt.

Kết quả điển hình: ảnh điện thoại 4 MB ở 4032×3024 px → 180–400 KB ở 1280×960 px.

### Bước 4 — Ghi vào media/

```typescript
await s3Client.send(new PutObjectCommand({
  Bucket: bucket,
  Key: destKey,
  Body: resizedBuffer,
  ContentType: 'image/jpeg',
}));
```

Ảnh nén đến `media/{entityId}/{baseName}.jpg`. Đây là key Lambda `aiEngine` và presigned URL frontend dùng để hiển thị.

### Không làm gì

Handler **không** xóa khỏi `incoming/`. Hai lý do:

1. `aiEngine` đọc từ đường `incoming/` khi phân tích ảnh món ăn.
2. Lifecycle rule S3 (`expirationInDays: 1` trên `incoming/`) tự dọn sau 24 giờ — đủ thời gian cho AI phân tích xong.

## Yêu cầu IAM

Lambda execution role cần:

- `s3:GetObject` và `s3:HeadObject` trên `incoming/*`.
- `s3:PutObject` trên `media/*`.

Amplify tự cấp các quyền này khi `addEventNotification` được gọi trong `backend.ts`.

## Tại sao 1280 px / quality 85

| Ràng buộc | Giá trị | Lý do |
|---|---|---|
| Kích thước tối đa | 1280 px | Phủ màn hình Retina (tới ~428 CSS px × 3× DPR = 1284 px). Cao hơn lãng phí bandwidth không có lợi trên mobile. |
| JPEG quality | 85 | Về cơ bản không mất chất cho ảnh món ăn. Dưới 80 xuất hiện artifacts blocking trên rau/cơm. |
| Progressive | true | Trình duyệt render preview mờ ngay lập tức; chi tiết nạp dần — cảm nhận tốc độ tốt hơn. |

## sharp trên Lambda ARM64

`sharp` là module Node.js native wrapping `libvips`. Trên Lambda ARM64 (Amplify Gen 2 mặc định cho Node.js 22), sharp phải được cài cho platform `linux-arm64`. Amplify bundler xử lý tự động khi cài trong `package.json` của Lambda:

```bash
cd backend/amplify/resize-image
npm install sharp
```

Nếu thấy `Error: Cannot find module 'sharp'` trong CloudWatch, binary sai platform (có thể x86 từ Mac) đã được bundle. Fix: đảm bảo cài trong thư mục Lambda và esbuild của Amplify target `linux/arm64`.

## Kiểm thử

Upload JPEG test qua CLI:

```bash
aws s3 cp test.jpg s3://<bucket>/incoming/test-user/test.jpg \
  --content-type image/jpeg
```

Xem log Lambda trong CloudWatch (`/aws/lambda/amplify-*-resize-image-*`):

```
Processing: incoming/test-user/test.jpg → media/test-user/test.jpg
Resized: 3840KB → 210KB
Done: compressed image saved to media/test-user/test.jpg
```

Xác nhận output:

```bash
aws s3 ls s3://<bucket>/media/test-user/
```

## Mô hình chi phí

- Lambda: 512 MB × ~500 ms/ảnh ≈ 0.5 GB-second. Mỗi resize ~$0.0000067. 10,000 ảnh/tháng: ~$0.07.
- S3 `GetObject` + `PutObject`: ~$0.005/1,000 request. 10,000 ảnh: ~$0.10.
- Data transfer S3 → Lambda: miễn phí cùng region.

## Liên kết

- [4.3.3 S3 Storage](/workshop/4.3.3-S3-Storage) — thiết lập bucket và lifecycle rule trên `incoming/`.
- [4.5.2 AIEngine](/workshop/4.5.2-AIEngine) — `analyzeFoodImage` đọc từ `incoming/`.
- [4.7.3 Voice & Camera](/workshop/4.7.3-Voice-Camera) — luồng upload từ client kích hoạt Lambda này.
