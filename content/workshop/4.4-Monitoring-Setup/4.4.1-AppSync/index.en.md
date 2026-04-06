# 4.4.1 AppSync — GraphQL Schema & Custom Resolvers

AppSync is the managed GraphQL layer for NutriTrack. Instead of hand-writing VTL templates or resolver pipelines, we declare everything in `amplify/data/resource.ts` using the Amplify `a.schema(...)` DSL. At `npx ampx sandbox` time (or on every push-to-branch deploy) the CLI compiles that file into a full AppSync API, backing DynamoDB tables, IAM roles, and Lambda wiring.

This page walks through the real `data/resource.ts` block by block.

## How `defineData` wires everything

At the bottom of the file you will find:

```typescript
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
```

Three things happen:

1. `defaultAuthorizationMode: 'userPool'` tells AppSync that every GraphQL operation must carry a Cognito ID token (from 4.3.2). The token is parsed on every request to extract `sub`, `email`, and the `cognito:groups` claim — that `sub` becomes the implicit `owner` field for any model that uses `allow.owner()`.
2. The `schema` object exported above is a big `a.schema({ ... })` map of models, custom types, queries, and mutations.
3. Amplify generates CRUD + subscription resolvers for each `a.model` and wires Lambda for each `a.query`/`a.mutation` that calls `.handler(a.handler.function(...))`.

## Building blocks of `a.schema(...)`

### 1. `a.customType(...)` — embedded nested objects

Custom types produce a GraphQL type but **no DynamoDB table**. They are embedded inside the parent item as a `Map` attribute. Example:

```typescript
Macros: a.customType({
  calories: a.float(),
  protein_g: a.float(),
  carbs_g: a.float(),
  fat_g: a.float(),
  saturated_fat_g: a.float(),
  polyunsaturated_fat_g: a.float(),
  monounsaturated_fat_g: a.float(),
  fiber_g: a.float(),
  sugar_g: a.float(),
  sodium_mg: a.float(),
  cholesterol_mg: a.float(),
  potassium_mg: a.float(),
}),
```

`Food.macros = a.ref('Macros')` then embeds the structure inline. Every customType in NutriTrack:

- **Food-side**: `Portions`, `Serving`, `Micronutrients`, `Macros`.
- **Log-side**: `LogMacros`, `LogIngredient`.
- **User-side**: `biometric`, `goal`, `dietary_profile`, `gamification`, `ai_preferences`.

Total: 11 custom types (plus the 8 models), all living in the same schema.

### 2. `a.model(...)` — a DynamoDB table

Here is the full `Food` model — a shared catalog of ~200 Vietnamese foods readable by guests:

```typescript
Food: a
  .model({
    food_id: a.string().required(),
    name_vi: a.string().required(),
    name_en: a.string(),
    aliases_vi: a.string().array(),
    aliases_en: a.string().array(),
    macros: a.ref('Macros'),
    micronutrients: a.ref('Micronutrients'),
    serving: a.ref('Serving'),
    verified: a.boolean(),
    source: a.string(),
  })
  .identifier(['food_id'])
  .authorization((allow) => [
    allow.guest().to(['read']),
    allow.authenticated().to(['read'])
  ]),
```

Things to notice:

- `.identifier(['food_id'])` overrides the default `id` partition key with our custom `food_id` string.
- `.array()` types become `List<String>` in DynamoDB.
- `a.ref('Macros')` embeds the Macros custom type as a map attribute.
- `allow.guest().to(['read'])` issues an IAM-auth mode in addition to Cognito, so unauthenticated (Cognito Identity Pool guest) users can read the catalog.

### 3. `a.model(...)` with owner auth — the user table

```typescript
user: a
  .model({
    user_id: a.string().required(),
    email: a.string().required(),
    display_name: a.string(),
    avatar_url: a.string(),
    created_at: a.string(),
    updated_at: a.string(),
    last_active_at: a.string(),
    onboarding_status: a.boolean(),
    friend_code: a.string(),
    ai_context_summary: a.string(),
    biometric: a.ref('biometric'),
    goal: a.ref('goal'),
    dietary_profile: a.ref('dietary_profile'),
    gamification: a.ref('gamification'),
    ai_preferences: a.ref('ai_preferences'),
  })
  .identifier(['user_id'])
  .secondaryIndexes((index) => [
    index('friend_code'),
  ])
  .authorization((allow) => [
    allow.owner(),
  ]),
```

Key points:

- `allow.owner()` injects an implicit `owner: String!` field at write time, set to the caller's Cognito `sub`. Every subsequent `list`/`get`/`update`/`delete` is filtered against it. Users **cannot** see rows they do not own.
- `.secondaryIndexes((index) => [index('friend_code')])` creates a DynamoDB GSI on `friend_code`, exposed in GraphQL as `listUserByFriendCode(friendCode: ...)`. This is how friend requests resolve a 6-character code to a user.
- Nested `biometric`, `goal`, `dietary_profile`, `gamification`, and `ai_preferences` are all `customType` embedded maps.

### 4. Models with GSIs — `FoodLog`

```typescript
FoodLog: a
  .model({
    date: a.string().required(),
    timestamp: a.datetime().required(),
    food_id: a.string(),
    food_name: a.string().required(),
    meal_type: a.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    portion: a.float(),
    portion_unit: a.string(),
    additions: a.string().array(),
    ingredients: a.json().array(),
    macros: a.ref('LogMacros'),
    micronutrients: a.ref('Micronutrients'),
    input_method: a.enum(['voice', 'photo', 'manual', 'barcode']),
    image_key: a.string(),
  })
  .secondaryIndexes((index) => [
    index('date'),
  ])
  .authorization((allow) => [
    allow.owner(),
  ]),
```

`index('date')` is the single most important index in NutriTrack — every home screen query is "list all my logs for today" which becomes `client.models.FoodLog.listFoodLogByDate({ date: '2026-04-05' })`. Without this GSI the query would be a full-table scan per user.

Models with GSIs:

- `user` — `friend_code`
- `FoodLog` — `date`
- `ChallengeParticipant` — `user_id`
- `Friendship` — `friend_id`

### 5. Relations — `hasMany` / `belongsTo`

Challenges use a classic one-to-many:

```typescript
Challenge: a
  .model({
    creator_id: a.string().required(),
    challenge_type: a.enum(['calories', 'protein', 'steps', 'streak', 'custom']),
    title: a.string().required(),
    description: a.string(),
    target_value: a.float(),
    status: a.enum(['pending', 'active', 'completed', 'expired']),
    start_date: a.string().required(),
    end_date: a.string().required(),
    participants: a.hasMany('ChallengeParticipant', 'challengeId'),
  })
  .authorization((allow) => [allow.authenticated()]),

ChallengeParticipant: a
  .model({
    challengeId: a.id().required(),
    challenge: a.belongsTo('Challenge', 'challengeId'),
    user_id: a.string().required(),
    display_name: a.string(),
    progress: a.float(),
    joined_at: a.datetime(),
  })
  .secondaryIndexes((index) => [index('user_id')])
  .authorization((allow) => [allow.authenticated()]),
```

`allow.authenticated()` means any logged-in user can read and write — challenges are public within the app. The relation generates a `Challenge.participants` field that AppSync resolves via a sub-query on the `ChallengeParticipant` table filtered by `challengeId`.

### 6. Mixed auth — `UserPublicStats` for the leaderboard

```typescript
UserPublicStats: a
  .model({
    user_id: a.string().required(),
    display_name: a.string(),
    avatar_url: a.string(),
    current_streak: a.integer(),
    longest_streak: a.integer(),
    pet_score: a.integer(),
    pet_level: a.integer(),
    total_log_days: a.integer(),
    last_log_date: a.string(),
  })
  .identifier(['user_id'])
  .authorization((allow) => [
    allow.owner().to(['create', 'update', 'delete', 'read']),
    allow.authenticated().to(['read']),
  ]),
```

Two rules stacked:

- The owner has full CRUD on their own row.
- Any authenticated user can `read` the row — that is how the friends leaderboard works without leaking private fields from the `user` table.

### 7. Custom resolvers — `a.query` / `a.mutation` backed by Lambda

```typescript
aiEngine: a
  .query()
  .arguments({
    action: a.string().required(),
    payload: a.string(),
  })
  .returns(a.string())
  .handler(a.handler.function(aiEngine))
  .authorization((allow) => [allow.authenticated()]),

processNutrition: a
  .query()
  .arguments({ payload: a.string().required() })
  .returns(a.string())
  .handler(a.handler.function(processNutrition))
  .authorization((allow) => [allow.authenticated()]),

friendRequest: a
  .mutation()
  .arguments({
    action: a.string().required(),
    payload: a.string().required(),
  })
  .returns(a.string())
  .handler(a.handler.function(friendRequest))
  .authorization((allow) => [allow.authenticated()]),
```

`.handler(a.handler.function(aiEngine))` attaches a direct Lambda data source. AppSync bypasses DynamoDB entirely for these three operations and synchronously invokes the Lambda, passing `event.arguments` equal to the input args. The Lambda returns a string (we stringify JSON on purpose to keep the GraphQL schema simple — see 4.5.2).

## Frontend usage

The Amplify JS client is fully typed off the schema:

```typescript
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

// List today's food logs (uses the `date` GSI)
const { data: logs } = await client.models.FoodLog.listFoodLogByDate({
  date: '2026-04-05',
});

// Create a log
await client.models.FoodLog.create({
  date: '2026-04-05',
  timestamp: new Date().toISOString(),
  food_name: 'Phở bò',
  meal_type: 'lunch',
  portion: 1,
});

// Call the ai-engine Lambda via the custom query
const result = await client.queries.aiEngine({
  action: 'analyzeFoodImage',
  payload: JSON.stringify({ s3Key: 'incoming/user-abc/img-1.jpg' }),
});
```

Type inference is end-to-end: renaming a field in `resource.ts` is a compile error across the entire React Native app on the next `npx ampx sandbox` run, which regenerates `amplify_outputs.json` and the TypeScript client types.

## Real-time subscriptions

Every model gets `onCreate`, `onUpdate`, and `onDelete` subscriptions for free:

```typescript
const sub = client.models.FoodLog.onCreate({
  filter: { date: { eq: '2026-04-05' } },
}).subscribe({
  next: (log) => {
    console.log('New log appeared:', log);
  },
});
```

This is the foundation for multi-device sync — when the phone logs a meal, a tablet showing the same user's dashboard sees the row appear within ~200 ms. Subscriptions are used in 4.6.2 to keep challenge leaderboards live.

## Inspecting the deployed API

After `npx ampx sandbox` finishes, the AppSync console shows:

- **Schema** tab — the fully expanded GraphQL SDL (much larger than `resource.ts` because Amplify generates input/filter/connection types).
- **Queries** tab — a playground. Paste a query, attach a Cognito token from Amplify Studio, and run.
- **Data sources** tab — one `AMAZON_DYNAMODB` entry per model, and three `AWS_LAMBDA` entries for the custom resolvers.

![AppSync console schema view](images/appsync-console-schema.png)

![AppSync queries playground](images/appsync-queries-playground.png)

## Troubleshooting

- **`Unauthorized` on a `list` or `get`**: owner mismatch. The row's `owner` attribute does not equal the caller's Cognito `sub`. Inspect the item in DynamoDB and compare to the JWT.
- **Schema change does not show up**: you need to rerun `npx ampx sandbox` (or push the branch). Amplify does not hot-reload schema mutations.
- **`Validation error: field X not found`**: the frontend is using a stale generated client. Delete `amplify_outputs.json`, restart the sandbox, and re-import.
- **GSI missing**: if you added `.secondaryIndexes(...)` after initial deploy, the CLI will run an `UpdateTable` which can take minutes for a large table. Watch the CloudFormation events.

## Cross-links

- Tables and item shapes: [4.4.2 DynamoDB](../4.4.2-DynamoDB/)
- Lambda resolvers: [4.5.2 AIEngine](../../4.5-Processing-Setup/4.5.2-AIEngine/), [4.5.3 ProcessNutrition](../../4.5-Processing-Setup/4.5.3-ProcessNutrition/)
- Subscriptions in anger: [4.6 Automation Setup](../../4.6-Automation-Setup/)
