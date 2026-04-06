# 4.3.3 S3 Storage

NutriTrack uses a single S3 bucket partitioned by prefix. Each prefix has a distinct access policy, and one prefix (`incoming/`) has a one-day lifecycle rule attached via a CDK escape hatch. This section creates the `storage/` resource, wires it into `backend.ts`, and explains why the bucket is shaped this way.

## Why a single bucket with prefixes

Four reasons:

1. **One CORS configuration.** The web build needs CORS for browser uploads; configuring it on one bucket is simpler than four.
2. **One IAM boundary.** The Cognito Identity Pool's authenticated role gets a single set of policies scoped by prefix, rather than four bucket ARNs.
3. **Cheaper S3 requests.** Cross-prefix operations (move from `incoming/` to `media/`) stay within one bucket and avoid the `CopyObject`-then-`DeleteObject` cross-bucket fee difference.
4. **Matches Amplify Gen 2's `defineStorage` model.** One call, one bucket.

## The four prefixes

| Prefix | Owner | Purpose | Lifetime |
| --- | --- | --- | --- |
| `incoming/{entity_id}/*` | User uploads | Landing zone for raw food photos; triggers `resizeImage` Lambda | 1 day (lifecycle) |
| `voice/*` | User uploads | Voice recordings for Transcribe; Lambda deletes after job completes | Ephemeral (explicit delete) |
| `avatar/{entity_id}/*` | Identity-scoped | User profile picture | Permanent |
| `media/{entity_id}/*` | Lambda writes | Processed JPEGs (1280px, q85 progressive) | Permanent |

`{entity_id}` is the Cognito Identity ID of the authenticated caller. Amplify resolves it automatically for IAM conditions — the client never constructs this path segment manually when using `uploadData({ path: 'incoming/...' })` because Amplify's storage plugin substitutes it.

## Step 1: Create `storage/resource.ts`

```bash
mkdir -p backend/amplify/storage
```

Paste the exact NutriTrack storage definition into `backend/amplify/storage/resource.ts`:

```typescript
import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'nutritrack_media_bucket',
  access: (allow) => ({
    // Landing Zone — user uploads raw photos here
    'incoming/{entity_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    // Voice recordings — staged for Transcribe, Lambda deletes after processing
    'voice/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    // Avatar — owner write/delete (identity-scoped), any authenticated user can read
    // allow.entity('identity') → IAM condition scoped to caller's identity (owner-only write)
    // allow.authenticated read → no identity scoping → any authenticated user sees any avatar
    'avatar/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.authenticated.to(['read']),
    ],
    // Trusted Zone — Lambda writes processed output here
    'media/{entity_id}/*': [
      allow.authenticated.to(['read', 'delete'])
    ]
  })
});
```

### Access rule walkthrough

**`incoming/{entity_id}/*` — authenticated read/write/delete**
The client uploads a raw photo taken by the camera. Every authenticated user can write to any path under `incoming/`, but the `{entity_id}` placeholder is resolved by the Amplify storage plugin on the client side, so in practice users only write to their own folder. The Lambda resize trigger (4.5.4) fires on `ObjectCreated` and reads from this prefix.

**`voice/*` — authenticated read/write/delete**
Voice recordings for the `aiEngine` voice-to-food flow. No `{entity_id}` partition because voice files are named with a UUID and live under `voice/<uuid>.webm`. AWS Transcribe needs its own `s3:GetObject` permission on this prefix via a bucket resource policy — that's added in `backend.ts` in the next step, and covered in 4.5.2.

**`avatar/{entity_id}/*` — identity-scoped write, public read**
Only the owner can write or delete their avatar. Any authenticated user can read any avatar — the friend list screen needs to display friends' pictures, so no per-identity read restriction. `allow.entity('identity')` translates to an IAM condition of `${cognito-identity.amazonaws.com:sub}` matching the path segment.

**`media/{entity_id}/*` — authenticated read/delete**
The `resizeImage` Lambda writes processed JPEGs here. Note there is **no** `write` permission for clients — the client cannot upload directly to `media/`. Only the Lambda's execution role (granted via `s3Bucket.grantReadWrite(resizeLambda)` in `backend.ts`) can write to this prefix.

## Step 2: Wire storage into `backend.ts`

Open `backend/amplify/backend.ts` and update it to add the `storage` import and include it in `defineBackend`. At the end of 4.3 your `backend.ts` should look like this:

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

// Add Lifecycle Rule to cleanup 'incoming/' after 1 day (CDK escape hatch)
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

The IAM grants to Lambdas (`grantReadWrite(resizeLambda)`, Bedrock permissions on `aiEngineLambda`, the Transcribe service resource policy) are added incrementally in later sections — do not paste them yet, they reference resources that do not exist.

### Why the escape hatch

`defineStorage` does not expose a lifecycle API. Amplify intends this to be added via CDK by reaching into `backend.storage.resources.bucket`, which is a standard `aws-cdk-lib/aws-s3` `Bucket` construct. From there you can:

- Read `s3Bucket.node.defaultChild` to get the underlying `CfnBucket` (L1 construct).
- Assign properties that L2 does not expose, such as `lifecycleConfiguration`.

This pattern — "L2 for defaults, L1 for overrides" — is the Amplify Gen 2 recommended way to tweak any generated resource. You will see it again in 4.5 for the Lambda environment variables and Transcribe bucket resource policy.

## Step 3: Deploy and verify

If the sandbox is running, saving `backend.ts` triggers a re-deploy. Otherwise:

```bash
npx ampx sandbox
```

Once `CREATE_COMPLETE`:

```bash
# List buckets — find the one starting with amplify-nutritrack...
aws s3 ls --region ap-southeast-2

# Check the lifecycle rule is attached
BUCKET=$(aws s3 ls --region ap-southeast-2 | grep amplify-nutritrack | awk '{print $3}' | head -1)
aws s3api get-bucket-lifecycle-configuration --bucket "$BUCKET" --region ap-southeast-2
```

You should see:

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

![S3 bucket in the AWS console](images/s3-bucket-console.png)

![Four prefixes after a few uploads](images/s3-prefixes.png)

## Step 4: Upload from the frontend

Amplify Storage v6 uses `uploadData` from `aws-amplify/storage`. The frontend food-logging flow grabs the Cognito identity ID and writes to `incoming/<identity>/<uuid>.jpg`:

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

The returned `path` is passed into the `analyzeFoodImage` GraphQL mutation in later sections; the `resizeImage` Lambda will have written the processed copy to `media/<identity>/<fileId>.jpg` by the time the client queries for it.

## CORS for the web build

Amplify Gen 2 configures a permissive CORS policy on the bucket by default: `AllowedOrigins: ['*']`, `AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD', 'DELETE']`, `AllowedHeaders: ['*']`, `ExposeHeaders: ['x-amz-server-side-encryption', 'x-amz-request-id', 'x-amz-id-2', 'ETag']`. This is acceptable for sandbox and workshop scope. For production, tighten `AllowedOrigins` to the exact frontend domains via another CDK escape hatch on `cfnBucket.corsConfiguration`.

## Cost note

For the entire workshop, S3 Standard storage cost is negligible — a few hundred small objects totals under 100 MB, which is well inside the 5 GB Free Tier. The real cost drivers once 4.5 is online are:

- **Bedrock Qwen3-VL** invocations (per 1K input/output tokens).
- **Transcribe** job-seconds.
- **Lambda** millisecond-GB for image resize.
- **DynamoDB** on-demand read/write units.

S3 request costs (PUT/GET) remain a rounding error at workshop scale. The one-day lifecycle rule on `incoming/` exists primarily for hygiene, not cost.

## Verify end to end

With the sandbox running and the Expo web dev server up, log in and upload a photo (or use the AWS CLI):

```bash
# Create a test file in your own incoming/ prefix (replace <IDENTITY_ID>)
echo "test" > /tmp/test.txt
aws s3 cp /tmp/test.txt "s3://$BUCKET/incoming/<IDENTITY_ID>/test.txt" --region ap-southeast-2

aws s3 ls "s3://$BUCKET/incoming/<IDENTITY_ID>/" --region ap-southeast-2
```

The file should appear. Twenty-four hours later, the lifecycle rule removes it — you can verify by checking the object's `Expires` header via `head-object`.

With the bucket in place and verified, phase 4.3 is complete. Continue to [`../../4.4-Monitoring-Setup/`](../../4.4-Monitoring-Setup/) to wire up the GraphQL API and DynamoDB models.
