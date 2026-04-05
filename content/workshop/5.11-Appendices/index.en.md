## Appendices & Reference

This section provides detailed reference materials, code snippets, and configuration details used throughout the NutriTrack 2.0 workshop.

#### Appendix A: AI Engine — Complete Action Reference

The `aiEngine` Lambda supports 10 AI actions, all routed through a single handler:

| # | Action | Input | Output | Model |
|---|--------|-------|--------|-------|
| 1 | `analyzeFoodImage` | Base64 image | Food name, macros (P/C/F/Cal) | Qwen3-VL (vision) |
| 2 | `scanBarcode` | Barcode string | Product info + nutrition | Qwen3-VL |
| 3 | `analyzeLabel` | Base64 label image | Extracted nutrition facts | Qwen3-VL (vision) |
| 4 | `voiceToFood` | S3 voice path | Transcribed food + macros | Transcribe → Qwen3-VL |
| 5 | `generateRecipe` | Fridge ingredients list | Recipe with steps + macros | Qwen3-VL |
| 6 | `generateCoachResponse` | User question + context | AI coach "Ollie" response | Qwen3-VL |
| 7 | `searchFoodNutrition` | Food name string | Nutrition data (JSON) | Qwen3-VL |
| 8 | `fixFood` | Incorrect food data | Corrected nutrition data | Qwen3-VL |
| 9 | `ollieCoachTip` | User daily stats | Personalized nutrition tip | Qwen3-VL |
| 10 | `calculateMacros` | Meal list | Total macro breakdown | Qwen3-VL |

#### Appendix B: DynamoDB Table Schemas

**user Table:**
```
PK: id (String) — Cognito sub
Attributes: email, display_name, avatar_url, height_cm, weight_kg, age,
  gender, activity_level, daily_calories, daily_protein, daily_carbs,
  daily_fat, streak_count, pet_level, total_xp, friend_code,
  ai_preferences, language
Owner-scoped: Yes
```

**Food Table:**
```
PK: id (String)
Attributes: name, name_vi, calories, protein, carbs, fat, fiber,
  serving_size, category, image_url, source
Auth: Owner write, Authenticated read
Pre-loaded: ~200 Vietnamese food items
```

**FoodLog Table:**
```
PK: id (String), Owner: owner (String)
GSI: logged_at (DateTime)
Attributes: food_name, meal_type, calories, protein, carbs, fat,
  serving_size, image_url, logged_at, source
```

#### Appendix C: Prompt Engineering Templates

**Food Analysis System Prompt:**
```
You are a Vietnamese nutrition expert and food analyst. When given a food 
image, identify the food item(s) and provide accurate nutritional data.

RULES:
1. Always respond in valid JSON format
2. Use Vietnamese food names when applicable
3. Provide per-serving nutritional values
4. If multiple items are detected, list each separately
5. Include confidence score (0-1)

OUTPUT FORMAT:
{
  "foods": [{
    "name": "string (English)",
    "name_vi": "string (Vietnamese)",
    "calories": number,
    "protein": number (grams),
    "carbs": number (grams),
    "fat": number (grams),
    "serving_size": "string",
    "confidence": number (0-1)
  }]
}
```

#### Appendix D: Bedrock Model Pricing Comparison

| Region | Input (Flex) | Input (Standard) | Input (Priority) | Output (Flex) | Output (Standard) | Output (Priority) |
|--------|-------------|-----------------|------------------|--------------|-------------------|-------------------|
| **US East** | $0.00026/1K | $0.00053/1K | $0.00093/1K | $0.00133/1K | $0.00266/1K | $0.00466/1K |
| **Tokyo** | $0.00032/1K | $0.00064/1K | $0.00112/1K | $0.00161/1K | $0.00322/1K | $0.00564/1K |
| **Mumbai** | $0.00031/1K | $0.00062/1K | $0.00109/1K | $0.00156/1K | $0.00313/1K | $0.00548/1K |

**Cost Calculation for 1,000 users (90K calls/month):**
- Input: 90K × 350 tokens = 31.5M tokens → $16.70 (Standard US East)
- Output: 90K × 120 tokens = 10.8M tokens → $28.73 (Standard US East)
- **Total AI cost: $45.42/month**

#### Appendix E: IAM Policy Reference

**Bedrock Access Policy (aiEngine Lambda):**
```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock:InvokeModel",
    "bedrock:InvokeModelWithResponseStream"
  ],
  "Resource": [
    "arn:aws:bedrock:ap-southeast-2::foundation-model/qwen.qwen3-vl-235b-a22b"
  ]
}
```

**DynamoDB Access Policy (processNutrition Lambda):**
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:Scan", "dynamodb:Query", "dynamodb:GetItem",
    "dynamodb:BatchGetItem", "dynamodb:DescribeTable"
  ],
  "Resource": ["arn:aws:dynamodb:*:*:table/Food-*"]
}
```

**Transcribe Access Policy (aiEngine Lambda):**
```json
{
  "Effect": "Allow",
  "Action": [
    "transcribe:StartTranscriptionJob",
    "transcribe:GetTranscriptionJob",
    "transcribe:DeleteTranscriptionJob"
  ],
  "Resource": ["*"]
}
```

#### Appendix F: Budget Calculator Reference

Complete monthly cost breakdown for 1,000 users (3 sessions/day):

| Service | Monthly Cost | Free Tier |
|---------|-------------|-----------|
| S3 Storage (3GB) | $0.08 | 5GB free |
| S3 Transfer (5GB out) | $0.60 | 100GB free (12 months) |
| S3 Requests (315K) | $1.35 | 2,000 free |
| Lambda (270K requests) | $0.05 | 1M free |
| Lambda Compute | $0.21 | 400K GB-s free |
| API Gateway (270K) | $0.34 | 1M free (12 months) |
| DynamoDB Storage (2GB) | $0.23 | 25GB free |
| DynamoDB Read (810K) | $0.12 | 25 RCU free |
| DynamoDB Write (180K) | $0.13 | 25 WCU free |
| Cognito (1K MAU) | $5.50 | 50K MAU free |
| CloudWatch | $1.00 | 10 metrics free |
| CloudTrail | $0.05 | 1 trail free |
| Secrets Manager (3) | $1.20 | — |
| KMS (1 key) | $1.00 | — |
| Textract (2.4K pages) | $3.60 | 1K free (3 months) |
| **Bedrock AI (90K calls)** | **$45.42** | — |
| **TOTAL** | **$60.87/month** | **$730.44/year** |

#### Appendix G: Useful Commands

```bash
# Amplify Sandbox Management
npx ampx sandbox                    # Start local sandbox
npx ampx sandbox delete             # Delete sandbox resources
npx ampx sandbox secret set KEY     # Set a secret value
npx ampx sandbox secret list        # List all secrets

# Generate Client Config
npx ampx generate outputs --outputs-out-dir ../frontend

# Frontend Development
cd frontend && npm start            # Start Expo dev server
cd frontend && npm run android      # Run on Android
cd frontend && npm run web          # Run on web browser
cd frontend && npm test             # Run tests

# Docker / ECS
docker build -t nutritrack-api .    # Build container
docker run -p 8000:8000 nutritrack-api  # Run locally
```