### Week 5 Objectives

* Finalize NutriTrack architecture diagram.
* Set up AWS development environment (IAM, S3, DynamoDB).
* Begin Proposal documentation for submission.
* Learn API Gateway and Lambda best practices.

### Tasks carried out this week

| Day | Task | Start Date | Completion Date | Reference Material |
| --- | --- | --- | --- | --- |
| 1 | - Architecture Finalization <br>&emsp; + Completed detailed AWS architecture diagram <br>&emsp; + Selected 6 core services: Cognito, API Gateway, Lambda, DynamoDB, S3, Bedrock | 02/02/2026 | 02/02/2026 | [Architecture v2.0] |
| 2 | - AWS Environment Setup (Part 1) <br>&emsp; + Created IAM roles with least privilege <br>&emsp; + Set up development IAM user for team <br>&emsp; + Configured MFA for all accounts | 03/02/2026 | 03/02/2026 | [IAM Config] |
| 3 | - AWS Environment Setup (Part 2) <br>&emsp; + Created S3 buckets for media storage <br>&emsp; + Configured bucket policies and CORS <br>&emsp; + Set up lifecycle rules for cost optimization | 04/02/2026 | 04/02/2026 | [S3 Buckets] |
| 4 | - DynamoDB Design <br>&emsp; + Designed single-table schema for NutriTrack <br>&emsp; + Created partition key and sort key strategy <br>&emsp; + Set up GSI for query patterns | 05/02/2026 | 05/02/2026 | [DynamoDB Schema](https://docs.aws.amazon.com/dynamodb/) |
| 5 | - API Gateway & Lambda Study <br>&emsp; + REST API vs HTTP API comparison <br>&emsp; + Lambda function best practices <br>&emsp; + Cold start optimization techniques | 06/02/2026 | 06/02/2026 | [API Gateway Docs](https://docs.aws.amazon.com/apigateway/) |
| 6-7 | - Proposal Documentation <br>&emsp; + Started writing NutriTrack Proposal <br>&emsp; + Included problem statement, objectives, timeline <br>&emsp; + Created budget estimation | 07/02/2026 | 08/02/2026 | [Proposal Draft] |

### Week 5 Achievements

* **Architecture:**
  * Completed comprehensive AWS architecture diagram with data flow.
  * Selected services based on serverless-first, cost-effective approach.
  * Architecture reviewed and approved by team.

* **AWS Environment:**
  * IAM roles configured with Principle of Least Privilege.
  * S3 buckets created: `nutritrack-media-dev`, `nutritrack-data-dev`.
  * DynamoDB table designed with single-table pattern for efficient queries.

* **Documentation:**
  * Proposal draft 70% complete with clear objectives and timeline.
  * Estimated 3-month development timeline aligned with internship period.

### Challenges & Lessons

* **Challenges:**
  * DynamoDB single-table design is different from traditional relational thinking.
  * Balancing cost optimization with performance requirements.

* **Solutions:**
  * Used Alex DeBrie's DynamoDB book and examples as reference.
  * Created access pattern document first, then designed schema.

* **Lessons Learned:**
  * Access patterns must be defined before DynamoDB schema design.
  * On-demand pricing is better for development; provisioned for production.

### Next Week Plan

* Complete and submit NutriTrack Proposal for review.
* Start backend implementation: API endpoints structure.
* Set up Lambda development environment with SAM CLI.
* Define OpenAPI specification for NutriTrack APIs.
