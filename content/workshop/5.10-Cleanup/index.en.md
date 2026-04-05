## Cleanup

After completing the workshop, follow these steps to remove all AWS resources and avoid ongoing charges.

#### Option 1: Amplify Sandbox Cleanup (Development)

If you used the Amplify Sandbox for local development:

```bash
cd backend
npx ampx sandbox delete
```

This command removes:
- All DynamoDB tables created by the sandbox
- S3 bucket and its contents
- Lambda functions
- Cognito User Pool
- AppSync API
- IAM roles and policies

#### Option 2: Amplify Hosted App Cleanup (Production)

For branch-deployed environments:

1. Go to **AWS Amplify Console**
2. Select your app → **App settings** → **General**
3. Click **Delete app** to remove all branch deployments and associated resources

#### Option 3: Manual Cleanup (Individual Resources)

If you need to clean up specific resources:

**ECS Fargate Resources:**
```bash
# Delete ECS service
aws ecs update-service --cluster nutritrack --service nutritrack-api --desired-count 0
aws ecs delete-service --cluster nutritrack --service nutritrack-api

# Delete ALB
aws elbv2 delete-load-balancer --load-balancer-arn YOUR_ALB_ARN

# Delete ECR repository
aws ecr delete-repository --repository-name nutritrack-api --force

# Delete VPC (after removing all dependencies)
aws ec2 delete-vpc --vpc-id YOUR_VPC_ID
```

**S3 Bucket (must empty first):**
```bash
aws s3 rb s3://YOUR-BUCKET-NAME --force
```

**DynamoDB Tables:**
```bash
aws dynamodb delete-table --table-name user-SUFFIX
aws dynamodb delete-table --table-name Food-SUFFIX
aws dynamodb delete-table --table-name FoodLog-SUFFIX
aws dynamodb delete-table --table-name FridgeItem-SUFFIX
aws dynamodb delete-table --table-name Challenge-SUFFIX
aws dynamodb delete-table --table-name ChallengeParticipant-SUFFIX
aws dynamodb delete-table --table-name Friendship-SUFFIX
aws dynamodb delete-table --table-name UserPublicStats-SUFFIX
```

**Cognito User Pool:**
```bash
aws cognito-idp delete-user-pool --user-pool-id YOUR_POOL_ID
```

**CloudWatch Resources:**
```bash
aws cloudwatch delete-alarms --alarm-names WorkshopBudgetAlert
aws logs delete-log-group --log-group-name /aws/lambda/YOUR_FUNCTION_NAME
```

#### Verification Checklist

After cleanup, verify in the AWS Console:

- [ ] **DynamoDB** — No workshop tables remaining
- [ ] **Lambda** — No workshop functions remaining
- [ ] **S3** — No workshop buckets remaining
- [ ] **Cognito** — No workshop user pools remaining
- [ ] **AppSync** — No workshop APIs remaining
- [ ] **ECS** — No clusters, services, or task definitions remaining
- [ ] **ECR** — No repository remaining
- [ ] **VPC** — Workshop VPC deleted
- [ ] **CloudWatch** — Workshop alarms and log groups deleted
- [ ] **Billing** — Check AWS Cost Explorer for any remaining charges

> ⚠️ **Important:** Always verify cleanup via the AWS Console. Some resources (like CloudWatch Log Groups) may persist after stack deletion and need manual removal.

Navigate to sub-sections for detailed cleanup procedures:

- [5.10.1 Manual Cleanup](5.10.1-manual/) — Step-by-step manual resource deletion
- [5.10.2 Amplify CLI Cleanup](5.10.2-cdk/) — Automated cleanup via Amplify CLI commands