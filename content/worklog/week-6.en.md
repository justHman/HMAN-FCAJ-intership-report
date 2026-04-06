### Week 6 Objectives

* Submit NutriTrack Proposal for mentor approval.
* Pivot AI approach: research LLM/VLM tool-use loop architecture.
* Study VPC Endpoints, NAT Gateway, and NAT Instance for cost optimization.
* Research alternative models and API-based nutrition data sources.

### Tasks carried out this week

| Day | Task                                                                                                                                                                                                                                                                | Start Date | Completion Date | Reference Material                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------- | ------------------------------------------------------------------------ |
| 1   | - Proposal Submission <br>&emsp; + Finalized NutriTrack Proposal document <br>&emsp; + Submitted for mentor review <br>&emsp; + Prepared presentation for defense                                                                                                   | 09/02/2026 | 09/02/2026      | [Final Proposal]                                                         |
| 2   | - LLM/VLM Tool-Use Research <br>&emsp; + Studied how LLMs use tools (function calling) <br>&emsp; + Researched tool-use loop patterns: model calls tool → gets result → reasons → calls next tool <br>&emsp; + Compared approaches: Bedrock vs direct API models    | 10/02/2026 | 10/02/2026      | [LLM Research Notes]                                                     |
| 3   | - AWS Networking Deep Dive (Part 1) <br>&emsp; + VPC Endpoints: Gateway vs Interface endpoints <br>&emsp; + NAT Gateway: managed, high availability, higher cost <br>&emsp; + NAT Instance: self-managed, lower cost alternative                                    | 11/02/2026 | 11/02/2026      | [VPC Docs](https://docs.aws.amazon.com/vpc/)                             |
| 4   | - AWS Networking Deep Dive (Part 2) <br>&emsp; + Cost comparison: NAT Gateway ($32/month) vs NAT Instance (t3.micro ~$8/month) <br>&emsp; + Private subnet architecture with NAT for ECS tasks <br>&emsp; + Internet Gateway vs NAT for outbound traffic            | 12/02/2026 | 12/02/2026      | [VPC Endpoint Docs](https://docs.aws.amazon.com/vpc/latest/privatelink/) |
| 5   | - Nutrition Data Sources Research <br>&emsp; + Evaluated USDA FoodData Central API <br>&emsp; + Tested OpenFoodFacts API for barcode lookup <br>&emsp; + Explored Avocavo Nutrition API for supplementary data                                                      | 13/02/2026 | 13/02/2026      | [API Docs]                                                               |
| 6-7 | - Architecture Revision <br>&emsp; + Redesigned AI approach: single VLM + tool-use loop instead of multi-model pipeline <br>&emsp; + Drafted new architecture with FastAPI backend instead of Lambda <br>&emsp; + Studied containerized deployment with ECS Fargate | 14/02/2026 | 15/02/2026      | [Architecture v2]                                                        |

### Week 6 Achievements

* **Proposal:**
  * NutriTrack Proposal submitted and **approved by mentor**.
  * Received positive feedback on the AI-powered approach.
  * Suggestion: focus on tool-use pattern for better accuracy and flexibility.

* **AI Architecture Pivot:**
  * Shifted from complex multi-model pipeline to **LLM/VLM with tool-use loop**.
  * This approach: model analyzes image → calls nutrition lookup tools → reasons about results → returns structured output.
  * Much simpler, more accurate, and resource-efficient.

* **AWS Networking Knowledge:**
  * Understood VPC Endpoints for private service access without NAT.
  * Learned NAT Instance as cost-saving alternative to NAT Gateway (4x cheaper).
  * Designed private subnet architecture for ECS tasks.

* **Data Sources:**
  * Identified 3 nutrition APIs: USDA, OpenFoodFacts, Avocavo — each with different strengths.

### Challenges & Lessons

* **Challenges:**
  * Deciding between Lambda (serverless) and ECS (containerized) for the backend.
  * VLM models require significant compute resources, not ideal for Lambda's 15-min timeout.

* **Solutions:**
  * Chose FastAPI + ECS Fargate for the backend: better for long-running AI inference tasks.
  * Lambda still used for lightweight triggers and non-AI endpoints.

* **Lessons Learned:**
  * Not everything needs to be serverless — containers are better for AI workloads with unpredictable execution times.
  * NAT Instance on t3.micro is a great cost-saving trick for non-production environments.

### Next Week Plan

* Lunar New Year (Tết) break — limited activity.
* Self-study: Load Balancer, ALB, Auto Scaling, Target Groups.
* Study HA architecture design patterns for production readiness.
* Prepare development environment for post-Tết coding sprint.
