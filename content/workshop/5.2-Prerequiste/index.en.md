## Prerequisites

Before starting this workshop, ensure you have the following tools and accounts ready.

#### AWS Account

- An active **AWS account** with administrator-level access
- AWS CLI v2 installed and configured with credentials:

```bash
aws configure
# Enter your Access Key ID, Secret Access Key, and default region (ap-southeast-2)
```

- Verify your setup:

```bash
aws sts get-caller-identity
```

#### Node.js & Package Manager

- **Node.js 18.x or later** (LTS recommended)
- **npm 9.x or later**

```bash
node --version   # Should output v18.x.x or higher
npm --version    # Should output 9.x.x or higher
```

#### AWS Amplify CLI

- Install the Amplify Gen 2 CLI globally:

```bash
npm install -g @aws-amplify/backend-cli
```

- Verify installation:

```bash
npx ampx --version
```

#### React Native / Expo

- **Expo CLI** for mobile development:

```bash
npm install -g expo-cli
```

- **Android Studio** (for Android emulator) or physical device with **Expo Go** app installed
- For iOS development: macOS with **Xcode 14+** (optional, Android-first strategy)

#### Git

- **Git** for version control:

```bash
git --version   # Should output 2.x or higher
```

#### Development Tools

- **VS Code** (recommended IDE) with extensions:
  - AWS Toolkit
  - TypeScript / JavaScript
  - React Native Tools
  - GraphQL syntax highlighting

#### Docker (for ECS Fargate section)

- **Docker Desktop** installed and running:

```bash
docker --version   # Should output 20.x or higher
```

#### Budget Considerations

> ⚠️ **Important:** This workshop uses paid AWS services. While most services offer Free Tier allowances, the **Amazon Bedrock** (Qwen3-VL) AI calls will incur charges based on token volume. Estimated workshop cost: **$2-5 USD**. Set up a **billing alarm** before proceeding:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "WorkshopBudgetAlert" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT:billing-alarm
```

#### Region Selection

This workshop uses the **Asia Pacific (Sydney) — ap-southeast-2** region, as it supports Amazon Bedrock with Qwen3-VL model access. Ensure all AWS resources are created in this region.

#### Checklist

Before proceeding, confirm:

- [ ] AWS account with admin access activated
- [ ] AWS CLI configured with `ap-southeast-2` as default region
- [ ] Node.js 18+ and npm installed
- [ ] Amplify CLI installed (`npx ampx --version`)
- [ ] Expo CLI installed, Expo Go app on device or emulator ready
- [ ] Git installed
- [ ] Docker Desktop installed (for Phase 6)
- [ ] Billing alarm configured