## Phase 3: Lambda Functions & AI Integration

In this phase, you will build the 4 Lambda functions that power NutriTrack's backend logic, including the core AI engine integrated with Amazon Bedrock's Qwen3-VL model.

#### Lambda Architecture Overview

| Function | Trigger | Purpose | Key Dependencies |
|----------|---------|---------|-----------------|
| `aiEngine` | AppSync Query | 10-action AI handler | Bedrock, S3, Transcribe |
| `processNutrition` | AppSync Query | Hybrid food lookup | DynamoDB, Bedrock |
| `friendRequest` | AppSync Mutation | Social system | DynamoDB TransactWriteItems |
| `resizeImage` | S3 Event (incoming/) | Image optimization | S3, sharp library |

#### Step 1: AI Engine Lambda

Create `backend/amplify/ai-engine/handler.ts`. This is the central AI orchestrator:

```typescript
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({ region: 'ap-southeast-2' });
const MODEL_ID = 'qwen.qwen3-vl-235b-a22b';

export const handler = async (event: any) => {
  const { action, payload } = event.arguments;

  // Route to appropriate handler
  switch (action) {
    case 'analyzeFoodImage':
      return await analyzeFoodImage(payload);
    case 'voiceToFood':
      return await voiceToFood(payload);
    case 'generateRecipe':
      return await generateRecipe(payload);
    case 'generateCoachResponse':
      return await generateCoachResponse(payload);
    case 'searchFoodNutrition':
      return await searchFoodNutrition(payload);
    // ... 5 more actions
    default:
      throw new Error(`Unknown action: ${action}`);
  }
};

async function analyzeFoodImage(payload: { imageBase64: string }) {
  const systemPrompt = `You are a Vietnamese nutrition expert. Analyze the food 
  in the image and return JSON: { "food_name": "", "food_name_vi": "", 
  "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "serving_size": "" }`;

  const response = await bedrock.send(new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    body: JSON.stringify({
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: systemPrompt },
          { type: 'image', source: { type: 'base64', data: payload.imageBase64 } },
        ],
      }],
      max_tokens: 1024,
      temperature: 0.3,
    }),
  }));

  return JSON.parse(new TextDecoder().decode(response.body));
}
```

#### Step 2: Process Nutrition Lambda (Hybrid Lookup)

```typescript
// backend/amplify/process-nutrition/handler.ts
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

const ddb = new DynamoDBClient({});

export const handler = async (event: any) => {
  const { foodName } = event.arguments;

  // Step 1: Try DynamoDB fuzzy match first (~200 Vietnamese foods)
  const dbResult = await fuzzyMatchFood(foodName);
  if (dbResult) return dbResult;

  // Step 2: Fallback to Bedrock AI generation
  return await generateNutritionFromAI(foodName);
};

async function fuzzyMatchFood(query: string) {
  // Scan Food table and find closest match using string similarity
  const result = await ddb.send(new ScanCommand({
    TableName: process.env.FOOD_TABLE_NAME || 'Food',
  }));
  // ... fuzzy matching logic with Levenshtein distance
}
```

> 💡 **Design Decision:** The hybrid DynamoDB → Bedrock approach reduces AI costs by ~70%, since most common Vietnamese foods are pre-loaded in the Food table and don't require an AI call.

#### Step 3: Friend Request Lambda

```typescript
// backend/amplify/friend-request/handler.ts
import { DynamoDBClient, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';

export const handler = async (event: any) => {
  const { action, userId, targetUserId } = event.arguments;

  switch (action) {
    case 'send':
      return await sendFriendRequest(userId, targetUserId);
    case 'accept':
      return await acceptFriendRequest(userId, targetUserId);
    case 'decline':
      return await declineFriendRequest(userId, targetUserId);
    case 'block':
      return await blockUser(userId, targetUserId);
  }
};
```

#### Step 4: Resize Image Lambda (S3 Trigger)

```typescript
// backend/amplify/resize-image/handler.ts
import sharp from 'sharp';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});

export const handler = async (event: any) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key; // e.g., incoming/user123/photo.jpg

    // 1. Download original from incoming/
    const original = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

    // 2. Process with sharp: resize to 1024px, convert to WebP 80%
    const processed = await sharp(await original.Body.transformToByteArray())
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // 3. Save to media/ prefix
    const mediaKey = key.replace('incoming/', 'media/').replace(/\.[^.]+$/, '.webp');
    await s3.send(new PutObjectCommand({
      Bucket: bucket, Key: mediaKey, Body: processed, ContentType: 'image/webp'
    }));

    // 4. Delete original from incoming/ (or let lifecycle rule handle it)
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
};
```

#### Step 5: Configure IAM Permissions in backend.ts

Add the following to your `backend/amplify/backend.ts`:

```typescript
import * as iam from 'aws-cdk-lib/aws-iam';

// Bedrock permissions for aiEngine
const aiEngineLambda = backend.aiEngine.resources.lambda;
aiEngineLambda.addToRolePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
  resources: ['arn:aws:bedrock:ap-southeast-2::foundation-model/qwen.qwen3-vl-235b-a22b'],
}));

// S3 + Transcribe permissions for aiEngine
s3Bucket.grantRead(aiEngineLambda);
s3Bucket.grantDelete(aiEngineLambda);
aiEngineLambda.addToRolePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['transcribe:StartTranscriptionJob', 'transcribe:GetTranscriptionJob'],
  resources: ['*'],
}));
```

#### Verification

After deploying all 4 Lambda functions:

1. Test `aiEngine` via AppSync console → Send a food analysis query
2. Test `processNutrition` → Search for "phở" (should return DynamoDB match)
3. Upload an image to `incoming/` in S3 → Verify `resizeImage` processes it to `media/`

> 🎯 **Checkpoint:** All 4 Lambda functions are deployed and responding. The `aiEngine` successfully communicates with Bedrock, and image upload triggers automatic resizing.
