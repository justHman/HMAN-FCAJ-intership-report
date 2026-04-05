## Phase 7: CI/CD & Multi-Environment Deployment

In this phase, you will configure the Amplify Hosting CI/CD pipeline for automated deployments across 3 environments, and set up the `amplify.yml` build specification.

#### Multi-Environment Strategy

NutriTrack uses a branch-based deployment model with AWS Amplify:

| Environment | Branch | Lambda Prefix | Purpose |
|-------------|--------|---------------|---------|
| **Sandbox** | Local (`npx ampx sandbox`) | `amplify-nutritrack-tdtp2--` | Personal development & testing |
| **Staging** | `feat/phase3-frontend-integration` | `amplify-d1glc6vvop0xlb-fe-` | Feature integration testing |
| **Production** | `main` | `amplify-d1glc6vvop0xlb-ma-` | Live user-facing deployment |

Each environment gets its own:
- DynamoDB tables (isolated data)
- S3 bucket (separate media storage)
- Cognito User Pool (independent user base)
- Lambda functions (environment-specific configuration)
- `amplify_outputs.json` (auto-generated per environment)

#### Step 1: Configure amplify.yml

Create `amplify.yml` at the project root:

```yaml
version: 1
backend:
  phases:
    preBuild:
      commands:
        - cd backend
        - npm ci
        # Install Lambda function dependencies
        - cd amplify/ai-engine && npm ci && cd ../..
        - cd amplify/process-nutrition && npm ci && cd ../..
        - cd amplify/friend-request && npm ci && cd ../..
        - cd amplify/resize-image && npm ci && cd ../..
    build:
      commands:
        - cd backend
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
        - npx ampx generate outputs --branch $AWS_BRANCH --app-id $AWS_APP_ID --out-dir ../frontend

frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci --legacy-peer-deps
    build:
      commands:
        - cd frontend
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
      - backend/node_modules/**/*
```

#### Step 2: Connect Repository to Amplify Hosting

1. Go to **AWS Amplify Console** → **New App** → **Host web app**
2. Connect your GitHub repository
3. Select the `main` branch for production
4. Amplify auto-detects the `amplify.yml` and configures the build pipeline

#### Step 3: Add Branch-Based Deployments

1. In Amplify Console → **Branch deployments** → **Connect branch**
2. Add `feat/phase3-frontend-integration` as a staging branch
3. Each branch push triggers an independent full deployment

#### Step 4: Generate Outputs for Frontend

After any backend change, regenerate the client configuration:

```bash
cd backend
npx ampx generate outputs --outputs-out-dir ../frontend
```

This creates `frontend/amplify_outputs.json` containing:
- Cognito User Pool ID & Client ID
- AppSync GraphQL endpoint & API key
- S3 bucket name & region
- Identity Pool ID

> ⚠️ **Warning:** Never manually edit `amplify_outputs.json`. It is auto-generated and environment-specific.

#### Step 5: Environment Variables & Secrets

Manage sensitive values using Amplify sandbox secrets:

```bash
cd backend
npx ampx sandbox secret set GOOGLE_CLIENT_SECRET
npx ampx sandbox secret list
```

For branch deployments, set environment variables in the Amplify Console under **App settings** → **Environment variables**.

#### Deployment Flow

```
Developer pushes to branch
    ↓
Amplify detects push (webhook)
    ↓
Backend Phase: Install deps → Deploy CDK stack (Lambda, DynamoDB, AppSync, S3, Cognito)
    ↓
Generate amplify_outputs.json for the branch
    ↓
Frontend Phase: Install deps → Build React Native Web → Deploy to CloudFront
    ↓
✅ Live URL available at https://branch.d1glc6vvop0xlb.amplifyapp.com
```

#### Verification

1. Push a commit to `main` branch → Verify Amplify triggers a build
2. Check build logs in Amplify Console for each phase
3. Verify the deployed URL loads the application correctly
4. Test that each environment has isolated data (different DynamoDB tables)

> 🎯 **Checkpoint:** Pushing to any connected branch triggers automatic deployment. Each environment has isolated resources and independent data.
