### Week 10 Objectives

* Deploy NutriTrack API to ECS Fargate ARM + Spot instances.
* Implement label detection pipeline for product images.
* Build barcode scanning pipeline with 3 nutrition API clients.
* Write comprehensive tests for all pipelines and API endpoints.

### Tasks carried out this week

| Day | Task | Start Date | Completion Date | Reference Material |
| --- | --- | --- | --- | --- |
| 1 | - ECS Fargate Deployment <br>&emsp; + Deployed API pipeline to ECS Fargate ARM + Spot <br>&emsp; + Deployed API pipeline to App Runner (comparison) <br>&emsp; + Configured task definitions and service settings | 10/03/2026 | 10/03/2026 | [ECS Docs](https://docs.aws.amazon.com/ecs/) |
| 2 | - Label Detection Scripts <br>&emsp; + Wrote scripts for detecting nutrition labels from product images <br>&emsp; + Created API endpoint for label detection <br>&emsp; + Integrated VLM model for label text extraction | 11/03/2026 | 11/03/2026 | [Label Detection Code] |
| 3 | - Label Detection Testing & Deploy <br>&emsp; + Tested scripts and API for label detection <br>&emsp; + Deployed label detection pipeline on AWS <br>&emsp; + Fixed image format handling issues | 12/03/2026 | 12/03/2026 | [Test Reports] |
| 4 | - Barcode Client Scripts <br>&emsp; + Wrote script for OpenFoodFacts API client <br>&emsp; + Wrote script for Avocavo Nutrition API client <br>&emsp; + Wrote script for USDA FoodData Central client | 13/03/2026 | 13/03/2026 | [Client Scripts] |
| 5 | - Client Testing <br>&emsp; + Wrote tests for OpenFoodFacts client <br>&emsp; + Wrote tests for Avocavo Nutrition client <br>&emsp; + Standardized mock data for DEMO_KEY fallback | 14/03/2026 | 14/03/2026 | [Test Suite] |
| 6-7 | - Barcode Pipeline Integration <br>&emsp; + Synchronized barcode output format across 3 clients <br>&emsp; + Built end-to-end pipeline: detect barcode → search food → return nutrition <br>&emsp; + Created API endpoint and comprehensive tests <br>&emsp; + All tests passing | 15/03/2026 | 15/03/2026 | [Pipeline Tests] |

### Week 10 Achievements

* **ECS Deployment:**
  * API successfully deployed to ECS Fargate ARM + Spot (cost-optimized).
  * Compared ECS Fargate vs App Runner — chose ECS for more control over networking.
  * Container running on ARM architecture for better price/performance.

* **Label Detection Pipeline:**
  * Complete pipeline: image → VLM extracts label text → parse nutrition facts.
  * API endpoint working with < 5s processing time.
  * Handles various image formats and quality levels.

* **Barcode Pipeline:**
  * 3 API clients implemented: OpenFoodFacts, USDA, Avocavo Nutrition.
  * Standardized output format across all 3 clients for consistent results.
  * Complete pipeline: scan barcode → search across 3 databases → merge results.
  * Comprehensive test suite with mock data fallback for DEMO_KEY.

* **Testing:**
  * All pipeline tests passing.
  * Mock data system implemented for testing without real API keys.

### Challenges & Lessons

* **Challenges:**
  * Each nutrition API returns data in completely different formats — standardization was complex.
  * ECS Fargate ARM images need multi-architecture Docker builds.
  * Image format handling caused unexpected errors (e.g., palette mode 'P' cannot save as JPEG).

* **Solutions:**
  * Created unified data transformer for each client to normalize output.
  * Used Docker buildx for multi-arch builds (AMD64 + ARM64).
  * Added image mode conversion (P → RGB/RGBA) before compression.

* **Lessons Learned:**
  * ARM-based Fargate instances offer ~20% cost savings over x86.
  * Standardizing API client outputs early prevents integration headaches later.
  * Image processing needs comprehensive format handling — never assume input format.

### Next Week Plan

* Set up CI/CD pipeline with GitHub Actions for automated ECS deployment.
* Optimize prompt engineering to reduce token usage and cost.
* Implement cache crawling for pre-populating nutrition data.
* Start Terraform infrastructure-as-code for reproducible deployments.
