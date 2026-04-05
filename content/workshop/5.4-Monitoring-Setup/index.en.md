## Phase 2: Data Layer — DynamoDB & GraphQL Schema

In this phase, you will define the complete GraphQL schema powering NutriTrack's data layer. AWS Amplify Gen 2 uses TypeScript CDK to define data models that automatically provision DynamoDB tables with AppSync resolvers.

#### Step 1: Create the Data Schema

Create `backend/amplify/data/resource.ts` with all 8 data models:

```typescript
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Core nutrition database (~200 Vietnamese food items)
  Food: a.model({
    name: a.string().required(),
    name_vi: a.string(),
    calories: a.float().required(),
    protein: a.float().required(),
    carbs: a.float().required(),
    fat: a.float().required(),
    fiber: a.float(),
    serving_size: a.string(),
    category: a.string(),
    image_url: a.string(),
    source: a.enum(['manual', 'ai_generated', 'verified']),
  }).authorization((allow) => [
    allow.authenticated().to(['read']),
    allow.owner().to(['create', 'update', 'delete']),
  ]),

  // User profile with gamification, biometrics, and AI preferences
  user: a.model({
    email: a.email().required(),
    display_name: a.string(),
    avatar_url: a.string(),
    // Biometrics
    height_cm: a.float(),
    weight_kg: a.float(),
    age: a.integer(),
    gender: a.enum(['male', 'female', 'other']),
    activity_level: a.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
    // Goals
    daily_calories: a.integer(),
    daily_protein: a.float(),
    daily_carbs: a.float(),
    daily_fat: a.float(),
    // Gamification
    streak_count: a.integer().default(0),
    pet_level: a.integer().default(1),
    total_xp: a.integer().default(0),
    // Social
    friend_code: a.string(),
    // AI Preferences
    ai_preferences: a.json(),
    language: a.enum(['en', 'vi']),
  }).authorization((allow) => [allow.owner()]),

  // Daily food logs with date-based GSI
  FoodLog: a.model({
    food_name: a.string().required(),
    meal_type: a.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    calories: a.float(),
    protein: a.float(),
    carbs: a.float(),
    fat: a.float(),
    serving_size: a.string(),
    image_url: a.string(),
    logged_at: a.datetime().required(),
    source: a.enum(['photo', 'voice', 'manual', 'barcode']),
  }).authorization((allow) => [allow.owner()])
    .secondaryIndexes((index) => [index('logged_at')]),

  // Kitchen/Fridge inventory
  FridgeItem: a.model({
    name: a.string().required(),
    quantity: a.float(),
    unit: a.string(),
    category: a.string(),
    expiry_date: a.date(),
    added_at: a.datetime(),
  }).authorization((allow) => [allow.owner()]),

  // Group challenges
  Challenge: a.model({
    title: a.string().required(),
    description: a.string(),
    type: a.enum(['streak', 'calories', 'steps', 'custom']),
    target_value: a.float(),
    start_date: a.datetime(),
    end_date: a.datetime(),
    participants: a.hasMany('ChallengeParticipant', 'challengeId'),
  }).authorization((allow) => [
    allow.authenticated().to(['read']),
    allow.owner().to(['create', 'update', 'delete']),
  ]),

  ChallengeParticipant: a.model({
    challengeId: a.id().required(),
    challenge: a.belongsTo('Challenge', 'challengeId'),
    progress: a.float().default(0),
    joined_at: a.datetime(),
    status: a.enum(['active', 'completed', 'dropped']),
  }).authorization((allow) => [allow.owner()]),

  // Bidirectional friendship records
  Friendship: a.model({
    friend_id: a.string().required(),
    status: a.enum(['pending', 'accepted', 'declined', 'blocked']),
    created_at: a.datetime(),
  }).authorization((allow) => [allow.owner()])
    .secondaryIndexes((index) => [index('friend_id')]),

  // Public leaderboard stats
  UserPublicStats: a.model({
    display_name: a.string(),
    avatar_url: a.string(),
    streak_count: a.integer().default(0),
    total_logs: a.integer().default(0),
    pet_level: a.integer().default(1),
  }).authorization((allow) => [
    allow.owner().to(['create', 'update', 'delete']),
    allow.authenticated().to(['read']),
  ]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({ schema });
```

#### Step 2: Understanding the Data Model

| Model | Purpose | Auth | Key Indexes |
|-------|---------|------|-------------|
| `Food` | Vietnamese food nutrition DB (~200 items) | Owner write, authenticated read | — |
| `user` | User profile + biometrics + gamification | Owner-only | — |
| `FoodLog` | Daily meal history | Owner-only | `logged_at` GSI |
| `FridgeItem` | Kitchen/fridge inventory | Owner-only | — |
| `Challenge` | Group challenge definitions | Owner write, authenticated read | — |
| `ChallengeParticipant` | Challenge participation (belongs to Challenge) | Owner-only | `challengeId` |
| `Friendship` | Friend records (bidirectional) | Owner-only | `friend_id` GSI |
| `UserPublicStats` | Leaderboard data | Owner write, authenticated read | — |

#### Step 3: Deploy and Verify

After adding the data schema to your sandbox:

```bash
npx ampx sandbox
```

Verify in the AWS Console:
1. Go to **DynamoDB** → Check that 8 tables were created
2. Go to **AppSync** → Check that the GraphQL API has all models, queries, and mutations
3. Test a mutation using the AppSync console query editor

> 🎯 **Checkpoint:** All 8 DynamoDB tables should be visible in the console, and you can successfully run a `createUser` mutation from the AppSync query editor.
