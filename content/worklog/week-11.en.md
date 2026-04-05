### Week 11 Objectives

* Set up CI/CD pipeline with GitHub Actions for ECS Fargate deployment.
* Optimize prompt engineering to reduce token usage and API costs.
* Implement cache crawling system for pre-populating nutrition data.
* Start Terraform infrastructure-as-code and Fly.io deployment.

### Tasks carried out this week

| Day | Task | Start Date | Completion Date | Reference Material |
| --- | --- | --- | --- | --- |
| 1 | - CI/CD Pipeline Setup <br>&emsp; + Created GitHub Actions workflow for ECS deployment <br>&emsp; + Configured ECS Fargate ARM with capacity provider (FARGATE_SPOT) <br>&emsp; + Implemented crawl data pipeline for cache clients | 16/03/2026 | 16/03/2026 | [GitHub Actions] |
| 2 | - Cache Data Synchronization <br>&emsp; + Synced 3 nutrition API clients data <br>&emsp; + Implemented batch retrieval for tool responses to reduce latency <br>&emsp; + Completed all testing for cache sync | 18/03/2026 | 18/03/2026 | [Cache Sync Code] |
| 3 | - Prompt & Token Optimization (Part 1) <br>&emsp; + Optimized tokens for food and label detection prompts <br>&emsp; + Reduced input/output token count <br>&emsp; + Cleared and simplified function definitions | 20/03/2026 | 20/03/2026 | [Optimization Notes] |
| 4 | - Prompt & Token Optimization (Part 2) <br>&emsp; + Enforced CSV output format to minimize output tokens <br>&emsp; + Optimized prompt speed and reduced API costs <br>&emsp; + Handled edge cases: no items and multiple items detected | 22/03/2026 | 22/03/2026 | [Token Analysis] |
| 5 | - Fly.io Deployment <br>&emsp; + Set up Fly.io as alternative deployment platform <br>&emsp; + Configured fly.toml and deployment scripts <br>&emsp; + Tested deployment with Claude model integration | 22/03/2026 | 22/03/2026 | [Fly.io Docs] |
| 6-7 | - Terraform & Documentation <br>&emsp; + Started Terraform IaC for AWS infrastructure <br>&emsp; + Wrote deployment documentation <br>&emsp; + Set up pytest for automated testing in CI/CD <br>&emsp; + Code review and graph documentation | 22/03/2026 | 22/03/2026 | [Terraform Config] |

### Week 11 Achievements

* **CI/CD Pipeline:**
  * GitHub Actions workflow deployed to ECS Fargate ARM + Spot successfully.
  * Automated pipeline: push → build Docker image → deploy to ECS.
  * Capacity provider strategy: FARGATE_SPOT for cost optimization.

* **Token & Prompt Optimization:**
  * Enforced **CSV output format** — drastically reduced output tokens (up to 60% reduction).
  * Optimized prompts for both food detection and label analysis.
  * Implemented batch tool calling to reduce API call latency.
  * Overall cost reduction: significant savings on Bedrock API usage.

* **Cache System:**
  * Dual-layer cache fully implemented:
    * **L1 Cache (User):** In-memory cache for current session data.
    * **L2 Cache (File):** JSON file-based persistent cache on volume storage.
  * Cache crawling pipeline: pre-populate cache with common food/ingredient data.
  * Batch retrieval from tools reduces latency for multi-item queries.

* **Multi-Platform Deployment:**
  * ECS Fargate ARM + Spot for production (AWS).
  * Fly.io as cost-effective alternative for development/staging.

* **Terraform:**
  * Infrastructure-as-code started for reproducible AWS deployments.

### Challenges & Lessons

* **Challenges:**
  * ECS FARGATE_SPOT instances can be interrupted — need graceful handling.
  * Balancing prompt optimization: too aggressive reduction can hurt accuracy.
  * Cache synchronization between Fly.io volume and S3 required careful design.

* **Solutions:**
  * Used capacity provider strategy with weight=1 for Spot to allow fallback.
  * A/B tested prompt changes to ensure accuracy is maintained.
  * Implemented cache merge strategy: get from Fly → merge local → upload to S3.

* **Lessons Learned:**
  * CSV output format is surprisingly effective for reducing LLM token usage.
  * Cache pre-population (crawling) can dramatically reduce runtime latency.
  * Multi-platform deployment (ECS + Fly.io) provides redundancy and cost flexibility.

### Next Week Plan

* Final presentation preparation and rehearsal.
* Implement JWT token return in API responses.
* Deploy ECS in private subnet with full networking (ALB, NAT).
* S3 cache synchronization for persistent storage.
* Complete all documentation and internship report.
