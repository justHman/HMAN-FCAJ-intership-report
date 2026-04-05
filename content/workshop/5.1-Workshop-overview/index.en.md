## NutriTrack — Architecture Overview

#### System Components

**NutriTrack** is a full-stack, AI-powered nutrition tracking platform built on AWS serverless architecture. The system uses **React Native (Expo)** for the cross-platform mobile frontend and **AWS Amplify Gen 2** to orchestrate the entire backend infrastructure, including authentication, APIs, storage, and compute.

The core AI engine leverages **Amazon Bedrock** with the **Qwen3-VL 235B** vision-language model to analyze food photos, scan nutrition labels, and generate personalized dietary insights — all in real time.

#### Architecture Diagram

![NutriTrack Solution Architecture](/hei-FCAJ-intership-report/solution-architect/nutritrack-solution-architect.drawio.png)

*NutriTrack AWS Solution Architecture — Full-stack serverless deployment*

#### Architecture Layers

The platform is organized into **7 distinct layers**:

1. **Edge & Security Layer**
   - **Route 53** — DNS routing and domain management
   - **AWS WAF** — Web Application Firewall for DDoS protection and request filtering
   - **Amazon CloudFront** — CDN for global content delivery and edge caching

2. **Authentication Layer (Amplify Managed)**
   - **Amazon Cognito** — User pools with email/OTP verification
   - **Google OAuth2** — Social sign-in federation
   - Biometric authentication (FaceID/TouchID) implemented on-device

3. **API Layer**
   - **AWS AppSync (GraphQL)** — Managed GraphQL with real-time subscriptions, automatic conflict resolution, and fine-grained authorization

4. **Compute Layer (Lambda)**
   - `aiEngine` — Multi-action AI handler (10 actions: analyzeFoodImage, voiceToFood, generateRecipe, generateCoachResponse, searchFoodNutrition, fixFood, ollieCoachTip, calculateMacros, challengeSummary, weeklyInsight)
   - `processFood` / `processNutrition` — Hybrid food lookup (DynamoDB fuzzy match → Bedrock AI fallback)
   - `friendRequest` — Social system (send/accept/decline/block) using DynamoDB TransactWriteItems
   - `resizeImage` — S3 event trigger, resizes to 1024px WebP at 80% quality using `sharp`

5. **AI/ML Services**
   - **Amazon Bedrock** — Qwen3-VL 235B for food image analysis and nutritional data generation
   - **AWS Transcribe** — Speech-to-text for voice food logging
   - **AWS Textract** — OCR for nutrition label scanning

6. **Storage & Data Layer**
   - **Amazon S3** — 3 prefixes: `incoming/` (raw uploads, 1-day expiry), `voice/` (recordings), `media/` (processed assets)
   - **Amazon DynamoDB** — 8 tables: `user`, `Food`, `FoodLog`, `FridgeItem`, `Challenge`, `ChallengeParticipant`, `Friendship`, `UserPublicStats`

7. **Container Layer (ECS Fargate)**
   - **VPC** with public/private subnets across 2 AZs (ap-southeast-2a)
   - **ECS Fargate** running FastAPI backend containers
   - **ALB** (Application Load Balancer) for traffic distribution
   - **Auto Scaling** for demand-based container scaling
   - **ECR** for Docker image storage
   - **VPC Endpoints** for secure AWS service access

#### Workshop Objectives

By the end of this workshop, you will have:

- ✅ Configured **AWS Amplify Gen 2** with TypeScript CDK backend
- ✅ Set up **Amazon Cognito** authentication with Google OAuth2
- ✅ Designed and deployed **8 DynamoDB data models** via AppSync GraphQL
- ✅ Built **4 Lambda functions** including the AI engine with Bedrock integration
- ✅ Configured **S3 storage** with lifecycle rules and event triggers
- ✅ Built a **React Native/Expo** mobile app with bilingual support
- ✅ Deployed a **FastAPI container** on ECS Fargate with ALB and Auto Scaling
- ✅ Set up **CI/CD pipelines** with Amplify Hosting across 3 environments
- ✅ Implemented **monitoring** with CloudWatch custom metrics and alarms

#### Estimated Time

| Section | Duration |
|---------|----------|
| Prerequisites & Setup | 30 minutes |
| Amplify Gen 2 + Auth | 45 minutes |
| Data Layer (DynamoDB) | 45 minutes |
| Lambda Functions & AI | 60 minutes |
| AppSync & Social Features | 30 minutes |
| React Native Frontend | 90 minutes |
| ECS Fargate Deployment | 60 minutes |
| CI/CD & Testing | 30 minutes |
| **Total** | **~6.5 hours** |

#### Cost Estimate

Running this workshop with all resources active for testing will cost approximately **$2-5 USD**. Clean up all resources after completion to avoid ongoing charges. Monthly production costs for 1,000 users are estimated at **$60.87/month** (see the Proposal section for detailed breakdown).
