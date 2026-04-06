# 4.3.1 Amplify Gen 2 Initialization

Amplify Gen 2 is a code-first backend framework: you declare resources with TypeScript, the CLI synthesizes a CDK app, and CloudFormation deploys it. There is no `amplify push`, no team-provider file, and no `aws-exports.js`. Every developer gets their own sandbox stack keyed by a local identifier, and CI deploys branch stacks on push.

This section scaffolds the `backend/` directory, installs the exact dependency set used in NutriTrack, and brings up your first sandbox.

## Directory layout

NutriTrack uses a monorepo layout with the frontend and backend as siblings:

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
    └── amplify_outputs.json   # auto-generated, do not edit
```

The `backend/` directory is the only one the Amplify CLI touches. `amplify_outputs.json` is written into `frontend/` so the Expo app can import it as a plain JSON module.

## Step 1: Scaffold the project

```bash
mkdir NutriTrack && cd NutriTrack
mkdir backend && cd backend
npm create amplify@latest
```

The `npm create amplify@latest` template creates the following files inside `backend/`:

| Path | Purpose |
| --- | --- |
| `amplify/backend.ts` | Entry point — calls `defineBackend(...)` with every resource |
| `amplify/auth/resource.ts` | Cognito configuration via `defineAuth` |
| `amplify/data/resource.ts` | GraphQL schema via `defineData` (AppSync + DynamoDB) |
| `package.json` | Pinned Amplify + CDK versions |
| `tsconfig.json` | Strict TypeScript, `module: "es2022"` |
| `.gitignore` | Excludes `.amplify/`, `node_modules/`, `amplify_outputs.json` |

Accept the defaults the generator suggests. It asks nothing about regions — the region comes from your AWS profile at `npx ampx sandbox` time.

## Step 2: Install dependencies

NutriTrack pins a specific dependency set. Replace the generated `backend/package.json` with this exact manifest so later sections (Sharp for image resize, AWS SDK v3 for Bedrock/Transcribe) compile cleanly:

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

Then install:

```bash
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is required. Amplify Gen 2 ships with pinned transitive peers that conflict with the AWS SDK v3 versions above; without the flag `npm` refuses to resolve. This is the same workaround enforced by `frontend/.npmrc`.

## Step 3: The backend.ts skeleton

At this point `amplify/backend.ts` only imports `auth` and `data`. We will extend it across phases 4.3 through 4.5 until it matches the full NutriTrack backend. For this section, leave it in its minimal form so the first sandbox deploys fast:

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

export const backend = defineBackend({
  auth,
  data,
});
```

By the end of the workshop `backend.ts` will look like this (do **not** paste this yet — the imported modules don't exist until later sections):

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

Keep this target shape in mind. Every later section adds exactly one of those keys to `defineBackend`, plus any CDK escape-hatch calls on `backend.<key>.resources.<construct>`.

## Step 4: Run the sandbox

From `backend/`:

```bash
npx ampx sandbox
```

What happens under the hood:

1. `ampx` reads `amplify/backend.ts` through `ts-node`.
2. It synthesizes a CDK app into `.amplify/artifacts/cdk.out/`.
3. It diffs against the currently deployed sandbox stack (none, on first run).
4. It submits a CloudFormation `CreateStack` request. The stack name is `amplify-nutritrack-<user-hash>-sandbox-<region-hash>`.
5. It tails CloudFormation events to your terminal until `CREATE_COMPLETE`.

Expected first-run output (abbreviated):

```text
[Sandbox] Watching for file changes...
File written: amplify_outputs.json
✔ Deployment completed in 142.37 seconds
```

First deploys take two to three minutes because CloudFormation provisions the Cognito User Pool, Identity Pool, the AppSync API, and a DynamoDB table per data model. Subsequent hot reloads after a file change take 15 to 40 seconds.

![Sandbox first start](images/ampx-sandbox-start.png)

You can watch progress in the CloudFormation console as well:

![CloudFormation progress](images/cfn-progress.png)

Leave the `ampx sandbox` process running. It watches `amplify/` for changes and re-deploys on save. Stop it with `Ctrl+C`; stopping does **not** tear down the stack — only `npx ampx sandbox delete` does that.

## Step 5: Generate amplify_outputs.json into the frontend

The sandbox writes `amplify_outputs.json` into `backend/` by default. The frontend expects it in `frontend/`. Run this once (and again whenever you're not running the watcher):

```bash
npx ampx generate outputs --outputs-out-dir ../frontend
```

This produces a JSON file that looks like:

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

Do not edit this file and do not commit it — the Amplify CI pipeline regenerates it per branch.

## Step 6: Verify

Three checks confirm the sandbox is healthy:

```bash
# 1. CloudFormation stack status
aws cloudformation describe-stacks \
  --stack-name amplify-nutritrack-$(whoami)-sandbox-$(cat .amplify/sandbox-identifier 2>/dev/null || echo '') \
  --query 'Stacks[0].StackStatus' \
  --region ap-southeast-2

# 2. User Pool exists
aws cognito-idp list-user-pools --max-results 20 --region ap-southeast-2

# 3. amplify_outputs.json has an auth block
node -e "console.log(Object.keys(require('../frontend/amplify_outputs.json')))"
```

The first command should print `CREATE_COMPLETE`, the second should list a pool whose name starts with `amplify-nutritrack`, and the third should print `[ 'auth', 'data', 'version' ]`.

## Troubleshooting

### Region mismatch

Symptom: sandbox deploys to `us-east-1` instead of `ap-southeast-2`.
Cause: `AWS_REGION` / `AWS_DEFAULT_REGION` not set, or AWS profile has a different default.
Fix:

```bash
export AWS_REGION=ap-southeast-2
export AWS_DEFAULT_REGION=ap-southeast-2
npx ampx sandbox delete   # clean the wrong-region stack
npx ampx sandbox          # re-deploy
```

### Expired SSO token

Symptom: `ExpiredTokenException: The security token included in the request is expired`.
Fix: re-run your SSO login (`aws sso login --profile <profile>`) and restart `ampx sandbox`. Gen 2 does not refresh SSO tokens mid-run.

### "Sandbox already exists for this identifier"

Symptom: `ampx sandbox` refuses to start because a previous sandbox from another branch is holding the lock file in `.amplify/`.
Fix: either delete the prior sandbox or use a different identifier.

```bash
npx ampx sandbox delete --identifier old-name
# or
npx ampx sandbox --identifier feature-branch
```

### `sharp` install fails on Windows

Symptom: `npm install --legacy-peer-deps` throws on `sharp` prebuild download.
Fix: install the Windows build toolchain or use WSL2. The workshop assumes WSL2 Ubuntu 22.04 or macOS.

### CloudFormation rollback on first deploy

Symptom: stack enters `ROLLBACK_COMPLETE`.
Fix: read the failure reason in the console. The most common cause is an IAM permission gap in your profile — the profile must be able to create User Pools, IAM roles, S3 buckets, and Lambda functions. `AdministratorAccess` (sandbox only) avoids the problem.

When all checks pass, continue to [4.3.2 Cognito Auth](../4.3.2-Cognito-Auth/).
