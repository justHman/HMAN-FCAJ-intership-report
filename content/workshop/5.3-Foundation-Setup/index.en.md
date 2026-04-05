## Phase 1: AWS Amplify Gen 2 Setup

In this phase, you will initialize the AWS Amplify Gen 2 backend project, configure authentication with Amazon Cognito (including Google OAuth2), and set up S3 storage with organized prefixes and lifecycle rules.

#### Step 1: Initialize the Project

Create a new directory and initialize the Amplify Gen 2 backend:

```bash
mkdir NutriTrack && cd NutriTrack
mkdir backend && cd backend
npm init -y
npm install @aws-amplify/backend @aws-amplify/backend-cli aws-cdk-lib constructs
```

Create the TypeScript configuration:

```json
// backend/tsconfig.json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "es2022",
    "moduleResolution": "bundler",
    "strict": true,
    "paths": { "$amplify/*": ["../amplify/auth/resource", "../amplify/data/resource"] }
  }
}
```

#### Step 2: Configure Authentication (Cognito)

Create the auth resource file at `backend/amplify/auth/resource.ts`:

```typescript
import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'NutriTrack - Verify your email',
      verificationEmailBody: (code) => `Your verification code is: ${code()}`,
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

> 💡 **Note:** Google OAuth2 credentials are obtained from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Create an OAuth 2.0 Client ID for "Web application" and "iOS/Android" platforms.

#### Step 3: Configure S3 Storage

Create `backend/amplify/storage/resource.ts`:

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

#### Step 4: Define the Backend Entry Point

Create the main `backend/amplify/backend.ts`:

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import * as s3 from 'aws-cdk-lib/aws-s3';

const backend = defineBackend({ auth, data, storage });

// Add S3 lifecycle rule: auto-delete incoming/ after 1 day
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

#### Step 5: Start Local Sandbox

Test your configuration locally:

```bash
cd backend
npx ampx sandbox
```

This will deploy all resources to a personal sandbox environment. The output will include your Cognito User Pool ID, AppSync endpoint, and S3 bucket name.

#### Verification

After sandbox deployment completes:

1. Check the AWS Console → **Cognito** → Verify User Pool created
2. Check **S3** → Verify bucket created with 3 prefixes
3. Check the generated `amplify_outputs.json` for correct configuration

> 🎯 **Checkpoint:** You should see `✅ Deployment complete` in your terminal, and `amplify_outputs.json` should contain your `user_pool_id`, `identity_pool_id`, and `bucket_name`.

Navigate to the sub-sections below for detailed setup of each component:

- [5.3.1 Set up S3 Buckets](5.3.1-s3-buckets/) — Configure S3 storage with organized prefixes
- [5.3.2 S3 Bucket Policies](5.3.2-s3-policies/) — Set up access policies and lifecycle rules
- [5.3.3 IAM Roles & Policies](5.3.3-iam-roles/) — Configure IAM permissions for Lambda functions