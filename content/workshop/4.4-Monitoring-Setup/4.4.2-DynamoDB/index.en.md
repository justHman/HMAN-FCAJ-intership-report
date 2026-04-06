# 4.4.2 DynamoDB — Tables, Indexes, Item Shapes

Each `a.model` in `amplify/data/resource.ts` compiles down to one DynamoDB table. Amplify appends an environment-specific suffix to guarantee per-sandbox isolation. All NutriTrack tables share these properties:

- **Billing mode**: on-demand (pay-per-request). No capacity planning needed for dev.
- **Encryption**: AWS-owned KMS key by default.
- **Point-in-time recovery**: off in sandboxes, recommended on for `main`.
- **Stream**: enabled (Amplify turns it on for subscriptions to work via AppSync).

## Naming convention per environment

Amplify names tables as `{ModelName}-{apiId}-{branch}`. Real names observed in this project:

| Environment | API suffix | Example table name |
| --- | --- | --- |
| Sandbox (`npx ampx sandbox`) | `tynb5fej6jeppdrgxizfiv4l3m` | `Food-tynb5fej6jeppdrgxizfiv4l3m-NONE` |
| Branch `feat/phase3` | `vic4ri35gbfpvnw5nw3lkyapki` | `Food-vic4ri35gbfpvnw5nw3lkyapki-NONE` |
| Branch `main` | `2c73cq2usbfgvp7eaihsupyjwe` | `Food-2c73cq2usbfgvp7eaihsupyjwe-NONE` |

The `-NONE` suffix is Amplify's placeholder for "no environment type." Sandboxes use this; production branches too. Never hard-code a table name in Lambda — either read from an env var injected in `backend.ts` or discover dynamically (see 4.5.3 for a real example).

## The 8 tables

### 1. `Food-*` — shared Vietnamese food catalog

- **Partition key**: `food_id` (String)
- **Sort key**: none
- **GSIs**: none
- **Auth**: guest read, authenticated read
- **Item count**: ~200 (seeded once, rarely updated)
- **Touched by**: AppSync direct resolvers (read), `process-nutrition` Lambda (scan + read)

Example item:

```json
{
  "food_id": "phobo_001",
  "name_vi": "Phở bò tái",
  "name_en": "Beef noodle soup (rare)",
  "aliases_vi": ["phở tái", "phở bò"],
  "aliases_en": ["pho bo tai"],
  "macros": {
    "calories": 420,
    "protein_g": 28,
    "carbs_g": 48,
    "fat_g": 12,
    "fiber_g": 2,
    "sodium_mg": 980
  },
  "micronutrients": { "iron_mg": 3.2, "calcium_mg": 45 },
  "serving": {
    "default_g": 500,
    "unit": "bowl",
    "portions": { "small": 0.7, "medium": 1.0, "large": 1.3 }
  },
  "verified": true,
  "source": "seed"
}
```

### 2. `user-*` — profile

- **Partition key**: `user_id` (String) — equal to the Cognito `sub`
- **GSI**: `user-friend_code-index` on `friend_code` (String)
- **Auth**: owner
- **Touched by**: AppSync resolvers, `friend-request` Lambda (read via GSI to resolve friend codes)

The item embeds five custom type maps (`biometric`, `goal`, `dietary_profile`, `gamification`, `ai_preferences`) plus a Cognito-populated `owner` attribute.

### 3. `FoodLog-*` — meal history

- **Partition key**: `id` (auto-generated `a.id()`)
- **GSI**: `FoodLog-date-index` on `date` — partition key of the GSI
- **Auth**: owner
- **Touched by**: AppSync resolvers only

This is the hottest table in the system. Every day-screen load runs `listFoodLogByDate(date: "2026-04-05")` which performs a `Query` on the `date-index` GSI filtered implicitly by `owner`. Cost scales linearly with log count, not with user count.

### 4. `FridgeItem-*` — kitchen inventory

- **Partition key**: `id`
- **GSIs**: none
- **Auth**: owner
- **Touched by**: AppSync resolvers, `ai-engine` Lambda indirectly (reads the items via AppSync before the `generateRecipe` call)

### 5. `Challenge-*` — group challenges

- **Partition key**: `id`
- **GSIs**: none
- **Auth**: authenticated (public read/write within the app)
- **Relation**: `hasMany` to `ChallengeParticipant`

### 6. `ChallengeParticipant-*` — join table

- **Partition key**: `id`
- **GSI**: `ChallengeParticipant-user_id-index` on `user_id`
- **Auth**: authenticated
- **Typical query**: "What challenges am I in?" becomes a Query on the `user_id` GSI.

### 7. `Friendship-*` — bidirectional friend graph

- **Partition key**: `id`
- **GSI**: `Friendship-friend_id-index` on `friend_id`
- **Auth**: owner
- **Touched by**: AppSync resolvers, `friend-request` Lambda (create/update pairs atomically via `TransactWriteItems`)

A friendship is stored as **two** rows — one owned by user A with `direction: 'sent'`, one owned by user B with `direction: 'received'` — because `allow.owner()` would otherwise prevent B from seeing A's row. `linked_id` connects the pair.

### 8. `UserPublicStats-*` — leaderboard view

- **Partition key**: `user_id`
- **GSIs**: none
- **Auth**: owner write, authenticated read
- **Touched by**: AppSync resolvers only

Denormalized summary written by the owner on every log. Other authenticated users can read it to populate leaderboard rows without breaching the private `user` table.

## Inspecting tables with the CLI

```bash
# List all project tables
aws dynamodb list-tables --region ap-southeast-2 \
  | jq -r '.TableNames[] | select(startswith("Food-"))'

# Peek at a handful of rows
aws dynamodb scan \
  --table-name Food-tynb5fej6jeppdrgxizfiv4l3m-NONE \
  --max-items 5 \
  --region ap-southeast-2

# Describe the GSI on FoodLog
aws dynamodb describe-table \
  --table-name FoodLog-tynb5fej6jeppdrgxizfiv4l3m-NONE \
  --region ap-southeast-2 \
  --query 'Table.GlobalSecondaryIndexes'
```

![DynamoDB tables list](images/dynamodb-tables-list.png)

![Food item structure](images/food-item-structure.png)

## Cost model

All tables are on-demand by default. For NutriTrack workloads:

- **Food**: effectively free. ~200 items, read-only traffic, fits comfortably in DAX or client cache.
- **user / UserPublicStats**: one row per user, one write per significant profile change. Negligible cost.
- **FoodLog**: dominant cost. Estimate at ~5 writes and ~20 reads per active user per day. At 1,000 DAU that's ~5k writes and ~20k reads per day — well under the free tier.
- **Friendship / ChallengeParticipant**: bursty but small.

For production on the `main` branch, consider switching the `FoodLog` table to provisioned capacity with autoscaling once traffic is predictable — on-demand is 7x the per-request cost of fully-utilized provisioned.

## Seeding the Food catalog

The Food table ships with a curated set of ~200 Vietnamese dishes. A one-time seeding script uses `BatchWriteItem`:

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import seed from './seed/vietnamese-foods.json';

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: 'ap-southeast-2' })
);
const TABLE = process.env.FOOD_TABLE_NAME!;

for (let i = 0; i < seed.length; i += 25) {
  const batch = seed.slice(i, i + 25).map((item) => ({
    PutRequest: { Item: { ...item, owner: 'SYSTEM' } },
  }));
  await client.send(new BatchWriteCommand({
    RequestItems: { [TABLE]: batch },
  }));
  console.log(`Seeded ${i + batch.length}/${seed.length}`);
}
```

Run it once per environment after `npx ampx sandbox` provisions the table. `BatchWriteItem` caps at 25 items per request, so the loop chunks accordingly.

## Troubleshooting

- **"ValidationException: One or more parameter values were invalid"** on a scan — you're likely hitting a reserved word (`date`, `status`, `name`). Use `ExpressionAttributeNames`.
- **Hot partition warning in CloudWatch** — unlikely in dev, but if `FoodLog` ever becomes skewed toward a single date with millions of rows, shard the partition key.
- **GSI eventually consistent reads** — the `date-index` on FoodLog is async. Immediately after a create, the row may not appear in the next list call. The frontend should optimistically insert locally.

## Cross-links

- Schema that produced these tables: [4.4.1 AppSync](../4.4.1-AppSync/)
- Lambdas that touch tables directly: [4.5.3 ProcessNutrition](../../4.5-Processing-Setup/4.5.3-ProcessNutrition/)
