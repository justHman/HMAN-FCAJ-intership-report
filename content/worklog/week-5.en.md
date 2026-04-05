### Week 5 Objectives

* Begin writing NutriTrack Proposal documentation.
* Set up AWS development environment (IAM, S3).
* Research AI pipeline: food detection → segmentation → weight estimation → nutrition lookup.
* Study VLM (Vision-Language Models) and their capabilities for food recognition.

### Tasks carried out this week

| Day | Task | Start Date | Completion Date | Reference Material |
| --- | --- | --- | --- | --- |
| 1 | - Proposal Documentation (Part 1) <br>&emsp; + Problem statement and objectives <br>&emsp; + Technology stack selection <br>&emsp; + Project timeline planning | 02/02/2026 | 02/02/2026 | [Proposal Draft] |
| 2 | - AWS Environment Setup <br>&emsp; + Created IAM roles with least privilege <br>&emsp; + Set up development IAM user for team <br>&emsp; + Created S3 buckets for media storage | 03/02/2026 | 03/02/2026 | [IAM Config] |
| 3 | - AI Pipeline Research (Part 1) <br>&emsp; + Studied vision models for food detection <br>&emsp; + Researched ingredient segmentation approaches <br>&emsp; + Explored weight estimation methods (pixel → cm calibration) | 04/02/2026 | 04/02/2026 | [Research Notes] |
| 4 | - AI Pipeline Research (Part 2) <br>&emsp; + Studied USDA food nutrition database <br>&emsp; + Designed pipeline: detect → segment → estimate weight → USDA lookup → calculate nutrition <br>&emsp; + Tested Qwen VLM model for food recognition | 05/02/2026 | 05/02/2026 | [Pipeline Design] |
| 5 | - Pipeline Testing <br>&emsp; + Tested end-to-end pipeline: detect ingredients → segment → estimate weight → USDA → nutrition <br>&emsp; + Identified issues: Qwen model poor at weight estimation <br>&emsp; + Pipeline slow and frequently OOM | 06/02/2026 | 06/02/2026 | [Test Results] |
| 6-7 | - Proposal Documentation (Part 2) <br>&emsp; + Architecture diagram with AWS services <br>&emsp; + Budget estimation <br>&emsp; + Research alternative VLM models for better accuracy | 07/02/2026 | 08/02/2026 | [Proposal Draft v2] |

### Week 5 Achievements

* **Proposal:**
  * Proposal draft 70% complete with clear objectives, timeline, and architecture.
  * Estimated 3-month development timeline aligned with internship period.

* **AWS Environment:**
  * IAM roles configured with Principle of Least Privilege.
  * S3 buckets created for media storage with proper policies and CORS.

* **AI Pipeline Research:**
  * Designed complete nutrition analysis pipeline: detect → segment → estimate weight → USDA lookup → calculate.
  * Explored 4 different calibration methods for weight estimation (pixel to cm conversion).
  * Identified limitations: Qwen VLM model performs poorly on weight estimation, pipeline is slow and memory-intensive.

### Challenges & Lessons

* **Challenges:**
  * The multi-step pipeline (detect → segment → estimate → lookup → calculate) is computationally expensive and slow.
  * Weight estimation from images using VLM models is highly inaccurate.
  * Frequent Out-of-Memory (OOM) errors when running the full pipeline locally.

* **Solutions:**
  * Researched alternative approaches: using LLM tool-use instead of multi-step vision pipeline.
  * Considered using cloud-based models (Bedrock) to avoid local resource limitations.

* **Lessons Learned:**
  * Not all problems need complex multi-model pipelines — sometimes a simpler approach with a smarter model works better.
  * Resource constraints should be identified early to avoid wasting time on infeasible approaches.

### Next Week Plan

* Finalize and submit NutriTrack Proposal for mentor review.
* Pivot the AI approach: research LLM/VLM with tool-use capabilities instead of multi-step pipeline.
* Study VPC Endpoints and NAT Gateway for cost-effective networking.
* Research alternative models and API-based nutrition data sources.
