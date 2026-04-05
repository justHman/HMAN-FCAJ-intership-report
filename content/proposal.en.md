# NutriTrack Platform

## A Unified AWS Serverless Solution for AI-Powered Nutrition Tracking

### 1. Executive Summary

The NutriTrack platform is designed for Vietnamese Gen Z and Millennials to enhance personal health management and nutrition data tracking. It targets 1,000+ active users, utilizing a cross-platform mobile interface built with React Native (Expo) to capture and analyze dietary data through photos, voice recordings, and manual input. Aligned with AWS Well-Architected Framework principles, the platform leverages AWS Serverless services (AWS Amplify Gen 2, AppSync, Lambda) and Generative AI (Amazon Bedrock running Qwen3-VL 235B) to deliver real-time nutrition tracking, predictive AI food logging, gamification (streaks, pet evolution, community challenges), and cost efficiency — all securely managed by Amazon Cognito with Google OAuth2 federation.

### 2. Problem Statement

**What's the Problem?**

Current nutrition tracking apps require tedious manual data entry and often lack extensive, personalized food databases for Vietnamese cuisine. Furthermore, users struggle with daily meal planning and managing household groceries, often leading to food waste and dietary inconsistency. There is no centralized, smart system that integrates real-time AI to generate missing food profiles or suggest meals based on available ingredients, and existing third-party APIs (such as Nutritionix or FatSecret) can be costly at scale and overly rigid in their data models — especially for regional foods like phở, bánh mì, or bún bò Huế.

**The Solution**

NutriTrack solves these pain points with a fully serverless AWS-native architecture:

- **AWS AppSync (GraphQL)** ingests user dietary data through real-time mutations and subscriptions.
- **AWS Lambda** (4 specialized functions) handles backend business logic — from AI orchestration to friend management to image processing.
- **Amazon DynamoDB** stores 8 data models (user profiles, food logs, challenges, etc.) with automatic scaling.
- **Amazon Bedrock** (Qwen3-VL 235B model) powers the AI pipeline — analyzing food photos, scanning barcodes/labels, and generating missing nutritional data on-the-fly.
- **AWS Amplify Gen 2** with React Native/Expo provides a polished bilingual UI (Vietnamese/English).

Key features include:

- 📸 **AI Food Analysis** — Snap a photo, get instant macronutrient breakdown
- 🎙️ **Voice-to-Food Logging** — Speak your meal, AWS Transcribe converts it
- 🍳 **Smart Kitchen/Fridge Tracker** — Manage grocery inventory, get AI recipe suggestions
- 🤖 **AI Coach "Ollie"** — Personalized nutrition tips and weekly insights
- 🎮 **Gamification** — Streaks, evolving virtual pet, community challenges
- 👥 **Social Features** — Friend system with leaderboards and head-to-head challenges

**Benefits and Return on Investment**

The solution establishes a foundational ecosystem for users to track their health and for the development team to scale an AI-assisted wellness platform. It reduces manual logging friction via the AI pipeline, simplifying the user experience and improving data reliability. Monthly operational costs are kept at approximately **$60.87/month ($730.44/year)** for 1,000 users by maximizing AWS Free Tier allowances and leveraging the serverless pay-as-you-go model. The break-even period is estimated at **1 month**, achieved through user subscriptions (premium AI features, unlimited photo analysis, advanced insights).

### 3. Solution Architecture

The platform employs a multi-layer serverless AWS architecture to manage user data and AI responses seamlessly. Data flows from the React Native mobile client through CloudFront/WAF for edge security, into AppSync GraphQL APIs, processed by specialized Lambda functions, stored in DynamoDB, and enriched using Bedrock AI models. The entire backend is orchestrated by AWS Amplify Gen 2 with automated CI/CD deployments across 3 environments.

#### NutriTrack Platform Architecture

![NutriTrack Solution Architecture](/hei-FCAJ-intership-report/solution-architect/nutritrack-solution-architect.drawio.png)

**AWS Services Used**

| Service | Role |
|---------|------|
| **AWS Amplify Gen 2** | Orchestrates backend infrastructure-as-code (TypeScript CDK), CI/CD pipelines, and manages 3 deployment environments (Sandbox, feat/phase3, main). |
| **AWS AppSync** | Facilitates secure GraphQL API communication between the React Native app and backend Lambda resolvers, with real-time subscriptions. |
| **AWS Lambda** | Processes business logic via 4 specialized functions: `ai-engine` (10 AI actions), `process-nutrition` (hybrid food lookup), `friend-request` (social features), and `resize-image` (S3 trigger image optimization). |
| **Amazon DynamoDB** | Stores all application data across 8 NoSQL tables: `user`, `Food` (~200 Vietnamese items), `FoodLog`, `FridgeItem`, `Challenge`, `ChallengeParticipant`, `Friendship`, `UserPublicStats`. |
| **Amazon Bedrock** | Powers AI features using Qwen3-VL 235B (ap-southeast-2) for food image analysis, barcode scanning, label reading, recipe generation, and AI coaching via embedded prompt templates. |
| **AWS Transcribe** | Converts voice recordings (stored in S3 `/voice` prefix) to text for seamless voice-based food logging. |
| **Amazon S3** | Stores user media across 3 organized prefixes: `incoming/` (raw uploads, auto-deleted after 1 day), `voice/` (audio recordings), `media/` (processed/resized assets). |
| **Amazon Cognito** | Secures access via email/OTP verification and Google OAuth2 federation, managing JWT tokens and user pools. |
| **Amazon CloudFront** | CDN for edge caching and content delivery acceleration to end users. |
| **AWS WAF** | Web Application Firewall to protect APIs from common web exploits and DDoS attacks. |
| **Route 53** | DNS routing for the application domain. |
| **Amazon ECR** | Container registry for the ECS Fargate self-hosted AI inference containers. |
| **Amazon ECS Fargate** | Serverless container orchestration for the FastAPI backend service, running in a VPC with private subnets across 2 AZs, with ALB and Auto Scaling. |
| **AWS CloudWatch** | Monitoring and observability with custom metrics (Bedrock_AI_Error_Rate, Image_Processing_Time, User_Daily_Active, Food_Log_Count). |
| **AWS CloudTrail** | API activity logging for audit and compliance tracking. |
| **AWS KMS** | Encryption key management for securing sensitive data at rest. |
| **AWS Secrets Manager** | Stores API keys, JWT master keys, and app-specific configuration secrets securely. |
| **AWS Textract** | OCR capabilities for scanning and extracting text from food nutrition labels. |

**Component Design**

- **Client Devices:** React Native/Expo mobile app collects user input via Camera (food photos, barcode/label scanning), Microphone (voice meal logging), and manual text entry. The app visualizes macronutrient data with interactive charts and a gamified UI featuring a virtual pet that evolves based on streak consistency.
- **Edge & Security:** Route 53 → WAF → CloudFront provides DNS resolution, DDoS protection, and global content acceleration before requests reach the backend.
- **Authentication:** Amazon Cognito handles user registration (email/OTP), Google OAuth2 social login, and JWT token management. The app additionally implements local biometric security (FaceID/TouchID) as a second layer.
- **Data Ingestion:** AppSync receives GraphQL mutations/queries from the mobile client, routing them to appropriate Lambda resolvers.
- **Compute Layer:** 4 Lambda functions process all business logic:
  - `aiEngine` — Orchestrates 10 AI actions (analyzeFoodImage, voiceToFood, generateRecipe, generateCoachResponse, searchFoodNutrition, fixFood, ollieCoachTip, calculateMacros, challengeSummary, weeklyInsight)
  - `processNutrition` — Hybrid lookup: DynamoDB fuzzy match against ~200 Vietnamese foods first, Bedrock AI fallback if not found
  - `friendRequest` — Social features: send/accept/decline/block requests using DynamoDB TransactWriteItems
  - `resizeImage` — S3 event trigger on `incoming/` prefix, uses `sharp` library to resize to 1024px and convert to WebP at 80% quality
- **Data Layer:** 8 DynamoDB tables with owner-scoped access and GSI optimization.
- **AI/ML Services:** Bedrock (Qwen3-VL 235B) + Transcribe provide the core intelligence layer, with all AI calls routed through the `aiEngine` Lambda with structured prompt templates.
- **Container Layer:** ECS Fargate runs the FastAPI self-hosted backend in a VPC across 2 AZs (ap-southeast-2a) with private subnets, ALB load balancing, Auto Scaling, and VPC Endpoints for secure AWS service access.

### 4. Technical Implementation

**Implementation Phases**

This project follows 4 phases:

1. **Build Theory and Draw Architecture (Month 0):** Research React Native/Expo setup with AWS Amplify Gen 2 and design the serverless architecture including the Bedrock AI integration. Draft the solution architecture diagram and define data models.
2. **Calculate Price and Check Practicality (Month 1):** Use the AWS Pricing Calculator to estimate costs (Lambda invocations, Bedrock tokens, DynamoDB capacity) for 1,000 users. Validate architecture feasibility with cost constraints under $65/month.
3. **Develop, Test, and Deploy (Months 2-3):** Code the React Native app UI with 6 main tab screens, implement 4 AWS Lambda handlers in TypeScript, configure AppSync GraphQL schema with 8 models, integrate Cognito auth flows, and resolve edge cases (JWT federation, DynamoDB table discovery). Test with Amplify Sandbox and deploy to production.
4. **Refine and Optimize (Post-Launch):** Audit UX/UI based on user feedback, improve gamification features (pet evolution videos, challenge mechanics), optimize AI prompt engineering for accuracy, and fix integration bugs (e.g., `NoValidAuthTokens` error in Bedrock calls).

**Technical Requirements**

- **Frontend:** React Native, Expo, TypeScript, Zustand (state management), react-native-reanimated (animations), expo-router (file-based routing), i18n (Vietnamese/English bilingual support).
- **Backend:** AWS Amplify Gen 2 (TypeScript CDK), Lambda (Node.js 18 runtime, ARM64), AppSync (GraphQL), DynamoDB (8 tables with GSI), Cognito (User Pools + Identity Pools), S3 (with lifecycle rules).
- **AI Integration:** Amazon Bedrock API (Qwen3-VL 235B, ap-southeast-2 region), AWS Transcribe (async transcription jobs), embedded prompt engineering with JSON schema enforcement. 10 AI actions orchestrated through a single `aiEngine` Lambda.
- **Infrastructure:** Docker/ECS Fargate for FastAPI backend, VPC with public/private subnets, ALB, Auto Scaling, ECR for container images.

### 5. Timeline & Milestones

**Project Timeline**

| Phase | Duration | Details |
|-------|----------|---------|
| **Pre-Phase** | 1 Month (Month 0) | UI/UX planning with Figma, legacy documentation review (migrating from Flutter to React Native), architecture drafting with draw.io, and AWS service evaluation. |
| **Implementation** | 3 Months | **Month 1:** Set up AWS Amplify Gen 2 environment, configure Cognito auth with Google OAuth, define 8 DynamoDB data models, and build core React Native UI components (Home, Add Food, Kitchen tabs).<br>**Month 2:** Connect AppSync GraphQL APIs, implement `process-nutrition` and `friend-request` Lambdas, build Fridge/Kitchen inventory UI, and integrate S3 image upload pipeline with `resize-image` trigger.<br>**Month 3:** Implement `ai-engine` Bedrock Lambda with 10 AI actions, build gamification system (streaks, pet evolution, challenges), perform E2E testing across 3 environments, resolve JWT auth bugs, and launch to production. |
| **Post-Launch** | Continuous | Performance optimization, user feedback integration, iOS build pipeline setup, and scaling the user base over 1 year. |

### 6. Budget Estimation

Budget is calculated for **1,000 active users performing 3 sessions per day over 30 days** (90,000 total AI interactions/month). Full pricing detail is available in the [Budget Estimation File (budget2.0.xlsx)](/budget2.0.xlsx).

**Infrastructure Costs (Monthly Estimate)**

| Component | Estimated Cost | Notes |
|-----------|----------------|-------|
| **Amazon S3** | $2.03/month | 3GB storage ($0.075) + 5GB transfer out ($0.60) + PUT/GET requests ($1.35) |
| **AWS Lambda** | $0.26/month | 270K requests ($0.054) + compute time ($0.205) — 0.2s avg, 512MB ARM64 |
| **API Gateway** | $0.34/month | 270K requests at $1.25/1M |
| **Amazon DynamoDB** | $0.47/month | 2GB storage ($0.228) + 810K reads ($0.115) + 180K writes ($0.128) |
| **Amazon Cognito** | $5.50/month | 1,000 MAU on Lite plan at $0.0055/MAU |
| **CloudWatch** | $1.00/month | 5 custom metrics + API request logging |
| **CloudTrail** | $0.05/month | 50,000 management events |
| **Secrets Manager** | $1.20/month | 3 secrets (API keys, JWT master key, DB config) |
| **AWS KMS** | $1.00/month | 1 customer-managed encryption key |
| **AWS Textract** | $3.60/month | 2,400 label scans (400 users × 6 labels/month) at $0.0015/page |
| **Amazon Bedrock (AI)** | **$45.42/month** | 90K AI calls: input tokens ($16.70) + output tokens ($28.73) — Qwen3-VL Standard pricing (US East) |
| **Total Estimation** | **$60.87/month** | **$730.44/12 months** |

**Bedrock AI Pricing Detail (Qwen3-VL 235B)**

| Region | Input (Standard) | Output (Standard) | Premium vs US |
|--------|------------------|-------------------|---------------|
| US East (Virginia) | $0.00053/1K tokens | $0.00266/1K tokens | Baseline |
| Asia Pacific (Tokyo) | $0.00064/1K tokens | $0.00322/1K tokens | +21% |
| Asia Pacific (Mumbai) | $0.00062/1K tokens | $0.00313/1K tokens | +18% |
| Asia Pacific (Sydney) | Used in production | Used in production | ap-southeast-2 |

**Software/Licenses:** $0 — All development tools are open-source (VS Code, Expo, Node.js). Apple Developer Account ($99/year) required for iOS distribution.

### 7. Risk Assessment

**Risk Matrix**

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Cost Overruns (Bedrock AI)** | Medium | Medium | Cache AI results in DynamoDB (`process-nutrition` hybrid lookup), implement request throttling, configure AWS Budget alerts at $80/month threshold |
| **Authentication Failures (Cognito/JWT)** | High | Low | Comprehensive E2E testing of federation flow, fallback to local AsyncStorage sessions, handle `UserNotConfirmedException` and `NotAuthorizedException` gracefully |
| **AI Hallucinations (Inaccurate Food Data)** | Medium | Medium | Fine-tune prompt templates in `ai-engine` with strict JSON schema enforcement, allow user verification/correction of AI-generated nutrition data, maintain ~200 pre-verified Vietnamese foods in DynamoDB |
| **iOS Build Blocked (macOS/Xcode Required)** | Low | High | Android-first strategy for MVP, use EAS Build cloud service for iOS builds, schedule macOS CI runners for later phase |
| **DynamoDB Table Discovery Ambiguity** | Medium | Low | Pass exact table names via environment variables in `backend.ts` (already implemented), avoid `discoverTables()` dynamic lookup |
| **Bedrock Region Availability** | Low | Low | Currently using ap-southeast-2; fallback to us-east-1 with cross-region Lambda configuration if needed |

**Contingency Plans**

- Revert to manual food entry or DynamoDB fuzzy match (~200 Vietnamese foods pre-loaded) if the AI pipeline or Bedrock integration fails.
- Use CloudFormation/Amplify rollback mechanisms for breaking backend deployments across the 3 environments.
- Switch from Qwen3-VL to alternative Bedrock models (Claude Haiku, Llama) if pricing becomes prohibitive at scale.

### 8. Expected Outcomes

**Technical Improvements:**

- Real-time automated nutrition data collection via photo/voice replaces tedious manual processes, reducing average meal logging time from ~3 minutes to ~10 seconds.
- A highly scalable, decoupled serverless backend built natively on AWS, capable of handling 10,000+ concurrent users with near-zero idle costs ($0.47/month DynamoDB baseline).
- A hybrid AI strategy (DynamoDB fuzzy match + Bedrock fallback) that balances cost efficiency with data completeness.

**Long-term Value**

- Establishes a verified, expansive Vietnamese food database generated organically by users and AI — currently seeded with ~200 items and growing.
- Provides reusable AI-generation architectural patterns (prompt templates, Lambda orchestration, Bedrock integration) applicable to future wellness features.
- Creates a social wellness platform with gamification mechanics (pet evolution, streaks, challenges) that drives daily engagement and user retention.
