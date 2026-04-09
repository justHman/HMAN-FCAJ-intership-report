# 4.5.3 ProcessNutrition — Hybrid Nutrition Lookup

`process-nutrition` resolves a food name to a structured nutrition object. It tries the local DynamoDB `Food` table first; only if that misses does it call Bedrock Qwen3-VL. For the ~200 Vietnamese foods already seeded, the DynamoDB path is fast and free. For anything unusual, Bedrock fills the gap.

## Resource definition

```typescript
// backend/amplify/process-nutrition/resource.ts
import { defineFunction } from '@aws-amplify/backend';

export const processNutrition = defineFunction({
  name: 'process-nutrition',
  entry: './handler.ts',
  runtime: 22,
  memoryMB: 512,
  timeoutSeconds: 30,
  resourceGroupName: 'data',
});
```

`resourceGroupName: 'data'` bundles this Lambda's permissions with the AppSync data stack — it gets IAM access to the DynamoDB tables automatically.

## AppSync wiring

```typescript
// data/resource.ts
processNutrition: a
  .query()
  .arguments({ payload: a.string().required() })
  .returns(a.string())
  .handler(a.handler.function(processNutrition))
  .authorization((allow) => [allow.authenticated()]),
```

The `payload` is a JSON string. Two modes are supported:

| `data.action` | Purpose | Input |
|---|---|---|
| `directSearch` | Fast single-word text lookup | `{ action: 'directSearch', query: 'phở bò' }` |
| _(omitted)_ | Process AI-generated ingredient array | `{ items: [ { meal_name, ingredients: [ { name, estimated_g } ] } ] }` |

## Table discovery

The Lambda needs the table name at runtime. It first checks the `FOOD_TABLE_NAME` env var (injected from `backend.ts`); if missing, it falls back to scanning `ListTablesCommand` for any table starting with `Food-`:

```typescript
async function discoverTableName(): Promise<string> {
  if (cachedTableName) return cachedTableName;

  if (process.env.FOOD_TABLE_NAME) {
    cachedTableName = process.env.FOOD_TABLE_NAME;
    return cachedTableName;
  }

  const result = await client.send(new ListTablesCommand({}));
  const foodTable = result.TableNames?.find((name) => name.startsWith('Food-'));
  if (!foodTable) throw new Error('Food table not found in DynamoDB');
  cachedTableName = foodTable;
  return cachedTableName;
}
```

**Known issue**: `ListTablesCommand` returns tables from all Amplify environments in the same AWS account. When two sandbox environments coexist, it may pick the wrong one. Fix: inject the env var explicitly in `backend.ts`:

```typescript
backend.processNutrition.resources.cfnResources.cfnFunction.addPropertyOverride(
  'Environment.Variables.FOOD_TABLE_NAME',
  backend.data.resources.tables['Food'].tableName
);
```

Once the env var is set, the `ListTablesCommand` path is never reached.

## Full-table cache

The handler loads all Food items into Lambda memory on first invocation and caches them for the lifetime of the execution context:

```typescript
let cachedFoods: any[] | null = null;

async function loadAllFoods(): Promise<any[]> {
  if (cachedFoods) return cachedFoods;
  const tableName = await discoverTableName();
  const allItems: any[] = [];
  let lastKey: any;
  do {
    const result = await docClient.send(new ScanCommand({
      TableName: tableName,
      ...(lastKey && { ExclusiveStartKey: lastKey }),
    }));
    if (result.Items) allItems.push(...result.Items);
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);
  cachedFoods = allItems;
  return allItems;
}
```

At ~200 items the full scan is negligible. On warm invocations (Lambda container reuse), the scan is skipped entirely.

## Text normalization

Vietnamese food names carry diacritics that vary in input. `normalize()` levels the playing field:

```typescript
function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip all diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}
```

`"Phở Bò"` → `"pho bo"`, `"phở bò"` → `"pho bo"`, `"Pho Bo"` → `"pho bo"`. All match.

## 5-tier fuzzy matching

`findBestMatch()` tries the cheapest match first and stops as soon as it finds one:

```typescript
function findBestMatch(ingredientName: string, foods: any[]): any | null {
  const n = normalize(ingredientName);

  // Tier 1: exact name_vi
  let m = foods.find(f => normalize(f.name_vi) === n);
  if (m) return m;

  // Tier 2: exact match in aliases_vi array
  m = foods.find(f => (f.aliases_vi || []).some((a: string) => normalize(a) === n));
  if (m) return m;

  // Tier 3: name_vi contains input OR input contains name_vi
  m = foods.find(f => {
    const nn = normalize(f.name_vi);
    return nn.includes(n) || n.includes(nn);
  });
  if (m) return m;

  // Tier 4: alias substring match
  m = foods.find(f =>
    (f.aliases_vi || []).some((a: string) => {
      const na = normalize(a);
      return na.includes(n) || n.includes(na);
    })
  );
  if (m) return m;

  // Tier 5: English name / English aliases
  m = foods.find(f => {
    const ne = normalize(f.name_en || '');
    return ne.includes(n) || n.includes(ne);
  });
  return m || null;
}
```

Tier 5 handles inputs like `"chicken breast"` matching a Vietnamese food record that has `name_en: "Chicken Breast"`.

## Direct search path

When `data.action === 'directSearch'`, the handler returns the matched item immediately in the same shape as the normal path — no per-ingredient nutrition math needed:

```typescript
if (data.action === 'directSearch' && data.query) {
  const match = findBestMatch(data.query, allFoods);
  if (match) {
    const defaultG = match.serving?.default_g || 100;
    return JSON.stringify({
      success: true,
      items: [{
        meal_name: match.name_vi,
        portion_size: `${defaultG} ${match.serving?.unit || 'g'}`,
        total_calories: match.macros?.calories || 0,
        // ... other macro fields
        ingredients: [{ name: match.name_vi, matched: true, source: 'database', ... }],
        db_match_count: 1,
        ai_fallback_count: 0,
      }],
    });
  }
  // No match → return false so the client can escalate to aiEngine
  return JSON.stringify({ success: false, error: 'Not found in DB direct search' });
}
```

If no match is found, the client is expected to escalate to `aiEngine` with `action: 'generateFoodNutrition'`.

## Normal path — ingredient array processing

When the client passes a multi-ingredient meal from the AI output, each ingredient goes through `findBestMatch`. Matched items use the `Food` table's per-100g macros scaled to `estimated_g`; unmatched items fall back to AI-estimated values:

```typescript
function calculateNutrition(dbFood: any, estimatedG: number) {
  const ratio = estimatedG / 100;
  return {
    calories:   Math.round((dbFood.macros?.calories  || 0) * ratio * 10) / 10,
    protein_g:  Math.round((dbFood.macros?.protein_g || 0) * ratio * 10) / 10,
    carbs_g:    Math.round((dbFood.macros?.carbs_g   || 0) * ratio * 10) / 10,
    fat_g:      Math.round((dbFood.macros?.fat_g     || 0) * ratio * 10) / 10,
  };
}
```

The final response includes `db_match_count` and `ai_fallback_count` so the UI can indicate confidence.

## IAM requirements

The Lambda role needs:
- `dynamodb:Scan`, `dynamodb:GetItem`, `dynamodb:Query` on the `Food-*` table.
- `dynamodb:ListTables` — only if you haven't eliminated the `discoverTableName()` fallback path.

No Bedrock permission is needed here — the `process-nutrition` Lambda itself does not call Bedrock. When a DB miss occurs, it returns `success: false` and the client calls `aiEngine.generateFoodNutrition` separately.

## Testing

Run `npx ampx sandbox` from `backend/`, then use the AppSync console to call the query:

```graphql
query TestProcessNutrition {
  processNutrition(payload: "{\"action\":\"directSearch\",\"query\":\"phở bò\"}") 
}
```

Expected: `{"success":true,"items":[{"meal_name":"Phở bò","portion_size":"...","total_calories":...}]}`.

For an unknown food:

```graphql
query {
  processNutrition(payload: "{\"action\":\"directSearch\",\"query\":\"wagyu ribeye\"}") 
}
```

Expected: `{"success":false,"error":"Not found in DB direct search"}` — client then calls `aiEngine` for the fallback.

## Cost model

- DynamoDB `Scan` on first cold invocation: ~1 RCU per KB of table size. At 200 items × ~2 KB each ≈ 400 KB → ~4 RCUs on first invocation per container lifetime. Subsequent warm invocations: 0 RCUs (in-memory cache).
- Bedrock is not called here — cost stays minimal.

## Cross-links

- [4.4.2 DynamoDB](/workshop/4.4.2-DynamoDB) — Food table schema and seeding.
- [4.5.2 AIEngine](/workshop/4.5.2-AIEngine) — Bedrock fallback for unrecognized foods.
- [4.5 Compute & AI](/workshop/4.5-Processing-Setup) — Section overview.
