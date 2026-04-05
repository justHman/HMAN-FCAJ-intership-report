## Phase 4: AppSync API & Social Features

In this phase, you will configure the AppSync GraphQL API resolvers, connect Lambda functions as custom query/mutation resolvers, and implement the social friend system.

#### Step 1: Connect Lambda Resolvers to AppSync

In your `backend/amplify/data/resource.ts`, add custom queries and mutations that route to Lambda:

```typescript
const schema = a.schema({
  // ... existing models ...

  // Custom AI query → routes to aiEngine Lambda
  aiEngine: a.query()
    .arguments({
      action: a.string().required(),
      payload: a.json().required(),
    })
    .returns(a.json())
    .handler(a.handler.function('aiEngine'))
    .authorization((allow) => [allow.authenticated()]),

  // Custom nutrition query → routes to processNutrition Lambda
  processNutrition: a.query()
    .arguments({
      foodName: a.string().required(),
      language: a.string(),
    })
    .returns(a.json())
    .handler(a.handler.function('processNutrition'))
    .authorization((allow) => [allow.authenticated()]),

  // Custom friend mutation → routes to friendRequest Lambda
  friendRequest: a.mutation()
    .arguments({
      action: a.enum(['send', 'accept', 'decline', 'block', 'remove', 'search']),
      userId: a.string().required(),
      targetUserId: a.string(),
      friendCode: a.string(),
    })
    .returns(a.json())
    .handler(a.handler.function('friendRequest'))
    .authorization((allow) => [allow.authenticated()]),
});
```

#### Step 2: Friend System Architecture

The friend system uses a DynamoDB `TransactWriteItems` pattern for atomic operations:

**Send Request Flow:**
1. User A calls `friendRequest(action: 'send', targetUserId: 'B')`
2. Lambda creates 2 Friendship records atomically:
   - A → B (status: `pending`, direction: `outgoing`)
   - B → A (status: `pending`, direction: `incoming`)

**Accept Request Flow:**
1. User B calls `friendRequest(action: 'accept', targetUserId: 'A')`
2. Lambda updates both records to `accepted` atomically

#### Step 3: Search by Friend Code

Users can share unique friend codes for discovery:

```typescript
async function searchByFriendCode(friendCode: string) {
  const result = await ddb.send(new ScanCommand({
    TableName: process.env.USER_TABLE_NAME,
    FilterExpression: 'friend_code = :code',
    ExpressionAttributeValues: { ':code': { S: friendCode } },
  }));
  return result.Items?.[0] || null;
}
```

#### Step 4: AppSync Authorization Rules

NutriTrack uses multi-strategy authorization:

| Strategy | Use Case |
|----------|----------|
| **Owner** | Private data (FoodLog, FridgeItem, user profile) |
| **Authenticated** | Read-only shared data (Food database, UserPublicStats) |
| **Custom** | Lambda-resolved queries (aiEngine, processNutrition) |

#### Verification

1. Test the friend system: Send, accept, and decline requests via AppSync console
2. Verify TransactWriteItems creates bidirectional records
3. Test friend code search functionality

> 🎯 **Checkpoint:** Friend system is fully functional. Sending a friend request creates 2 records atomically, and accepting updates both to 'accepted' status.
