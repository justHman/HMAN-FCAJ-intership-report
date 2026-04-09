# 4.5.4 ResizeImage — S3 Image Processing Lambda

`resize-image` is an S3-triggered Lambda. Every time an object is created under the `incoming/` prefix, S3 fires an event, the Lambda reads the raw upload, resizes it to at most 1280 px on the longest side, and writes a progressive JPEG at quality 85 to `media/{entityId}/{baseName}.jpg`. It does not delete the source — a 1-day S3 lifecycle rule on `incoming/` handles cleanup automatically.

## Resource definition

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

`resourceGroupName: 'storage'` ties this Lambda to the storage stack. No AppSync entry — it is invoked only by the S3 event notification.

## S3 trigger wiring

In `backend.ts`, after the storage resource is defined:

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

The `{ prefix: 'incoming/' }` filter means only objects uploaded to `incoming/` fire the event. Objects written to `media/`, `voice/`, or `avatar/` are ignored.

## Handler walkthrough

```typescript
// Key constants
const MAX_DIMENSION = 1280; // px, longest side
const JPEG_QUALITY = 85;
```

For each S3 record in the event:

### Step 1 — Parse the key

```typescript
// Path format: incoming/{entity_id}/{filename}
const parts = key.split('/');
const entityId = parts.slice(1, parts.length - 1).join('/');
const originalFilename = parts[parts.length - 1];
const baseName = originalFilename.replace(/\.[^.]+$/, ''); // strip extension
const destKey = `media/${entityId}/${baseName}.jpg`;
```

`entityId` is everything between `incoming/` and the filename. For a key like `incoming/us-east-1:abc123/photo-xyz.jpg`, `entityId` becomes `us-east-1:abc123` and `destKey` becomes `media/us-east-1:abc123/photo-xyz.jpg`.

### Step 2 — Validate content type

```typescript
const head = await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
const contentType = head.ContentType || '';
if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(contentType)) {
  console.error(`Unsupported content type: ${contentType} for ${key}`);
  continue;
}
```

Non-image uploads (e.g., audio accidentally uploaded to `incoming/`) are skipped with a warning log, not an exception that would retry the event.

### Step 3 — Resize with sharp

```typescript
const resizedBuffer = await sharp(originalBuffer)
  .rotate()                          // auto-rotate by EXIF orientation
  .resize(MAX_DIMENSION, MAX_DIMENSION, {
    fit: 'inside',                   // preserve aspect ratio
    withoutEnlargement: true,        // don't upscale small images
  })
  .jpeg({ quality: JPEG_QUALITY, progressive: true })
  .toBuffer();
```

- `.rotate()` corrects portrait photos taken on a phone that stores orientation in EXIF data. Without this, photos appear sideways on the web.
- `fit: 'inside'` scales the image so neither dimension exceeds 1280 px while preserving the original aspect ratio.
- `withoutEnlargement: true` leaves images smaller than 1280 px untouched.
- `progressive: true` produces an interlaced JPEG that renders progressively in the browser as it loads.

Typical result: a 4 MB phone photo at 4032×3024 px becomes 180–400 KB at 1280×960 px.

### Step 4 — Write to media/

```typescript
await s3Client.send(new PutObjectCommand({
  Bucket: bucket,
  Key: destKey,
  Body: resizedBuffer,
  ContentType: 'image/jpeg',
}));
```

The compressed image lands at `media/{entityId}/{baseName}.jpg`. This is the key the `aiEngine` Lambda and the frontend presigned URL use for display.

### What is NOT done

The handler does **not** delete from `incoming/`. There are two reasons:

1. `aiEngine` reads from the `incoming/` path when analyzing the food image (it receives the `s3Key` that the client uploaded).
2. The S3 lifecycle rule (`expirationInDays: 1` on `incoming/`) cleans up automatically after 24 hours, which is enough time for the AI analysis to complete.

## IAM requirements

The Lambda execution role needs:

- `s3:GetObject` and `s3:HeadObject` on `incoming/*`.
- `s3:PutObject` on `media/*`.

These are granted in `backend.ts` when the storage resource calls `addEventNotification` — Amplify automatically adds the necessary permissions to the Lambda role.

## Why 1280 px / quality 85

These values balance display quality against storage and bandwidth:

| Constraint | Value | Rationale |
|---|---|---|
| Max dimension | 1280 px | Covers Retina phone screens (up to ~428 CSS px × 3× DPR = 1284 px). Higher wastes bandwidth with no perceptible gain on mobile. |
| JPEG quality | 85 | Visually lossless for food photos. Below 80 introduces blocking artifacts on vegetables/rice textures. |
| Progressive | true | The browser renders a blurry preview immediately; detail fills in as the rest of the file arrives — better perceived performance. |

## sharp on Lambda ARM64

`sharp` is a native Node.js module that wraps `libvips`. On Lambda ARM64 (which Amplify Gen 2 uses by default for Node.js 22 functions), sharp must be installed for the `linux-arm64` platform. Amplify's bundler handles this automatically when you install sharp in the Lambda's own `package.json`:

```bash
cd backend/amplify/resize-image
npm install sharp
```

If you see `Error: Cannot find module 'sharp'` in CloudWatch, it means the wrong binary was bundled (likely an x86 binary from a Mac). Fix: ensure the install happens inside the Lambda folder and that Amplify's esbuild config targets `linux/arm64`.

## Testing

1. Upload a test JPEG to `incoming/{userId}/test.jpg` via the AWS console or CLI:

```bash
aws s3 cp test.jpg s3://<bucket>/incoming/test-user/test.jpg \
  --content-type image/jpeg
```

2. Watch the Lambda log group in CloudWatch (`/aws/lambda/amplify-*-resize-image-*`):

```
Processing: incoming/test-user/test.jpg → media/test-user/test.jpg
Resized: 3840KB → 210KB
Done: compressed image saved to media/test-user/test.jpg
```

3. Confirm the output:

```bash
aws s3 ls s3://<bucket>/media/test-user/
aws s3 cp s3://<bucket>/media/test-user/test.jpg ./output.jpg && open output.jpg
```

## Cost model

- Lambda: 512 MB × ~500 ms per image ≈ 0.5 GB-seconds. At Amplify's ARM64 pricing (~$0.0000133/GB-s), each resize costs $0.0000067. For 10,000 photos/month: $0.067.
- S3 `GetObject` + `PutObject`: ~$0.005 per 1,000 requests. For 10,000 photos: $0.10.
- Data transfer from S3 to Lambda: free within the same region.

## Cross-links

- [4.3.3 S3 Storage](/workshop/4.3.3-S3-Storage) — bucket setup and the lifecycle rule on `incoming/`.
- [4.5.2 AIEngine](/workshop/4.5.2-AIEngine) — `analyzeFoodImage` reads from `incoming/` after this Lambda writes to `media/`.
- [4.7.3 Voice & Camera](/workshop/4.7.3-Voice-Camera) — client upload flow that triggers this Lambda.
