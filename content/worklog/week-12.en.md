### Week 12 Objectives

* Deliver final presentation to all stakeholders.
* Complete self-evaluation and feedback sections.
* Submit internship report.
* Celebrate project completion and reflect on the journey.

### Tasks carried out this week

| Day | Task                                                                                                                                                                         | Start Date | Completion Date | Reference Material       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------- | ------------------------ |
| 1   | - Final Presentation Preparation <br>&emsp; + Final rehearsal with team <br>&emsp; + Prepared backup demo video <br>&emsp; + Tested all technical setup                      | 23/03/2026 | 23/03/2026      | [Presentation]           |
| 2   | - Final Presentation <br>&emsp; + Presented NutriTrack to FCJ leadership <br>&emsp; + Live demo with Q&A session <br>&emsp; + Received commendation for architecture         | 24/03/2026 | 24/03/2026      | [Presentation Recording] |
| 3   | - Self-Evaluation <br>&emsp; + Completed self-evaluation form <br>&emsp; + Reflected on 12-week journey <br>&emsp; + Identified strengths and growth areas                   | 25/03/2026 | 25/03/2026      | [Evaluation Form]        |
| 4   | - Program Feedback <br>&emsp; + Wrote detailed feedback for FCJ program <br>&emsp; + Highlighted positive experiences <br>&emsp; + Suggested improvements for future interns | 26/03/2026 | 26/03/2026      | [Feedback Form]          |
| 5   | - Report Finalization <br>&emsp; + Final review of all report sections <br>&emsp; + Verified bilingual content accuracy <br>&emsp; + Generated final PDF version             | 27/03/2026 | 27/03/2026      | [Final Report]           |
| 6-7 | - Celebration & Wrap-up <br>&emsp; + Team celebration dinner <br>&emsp; + Knowledge transfer to next cohort <br>&emsp; + LinkedIn post about internship experience           | 28/03/2026 | 29/03/2026      | [Photos]                 |

### Week 12 Achievements

* **Final Presentation:**
  * Successfully presented NutriTrack to 15+ stakeholders.
  * Live demo went smoothly without technical issues.
  * Received excellent feedback on serverless architecture design.
  * Team NeuraX ranked among top 3 projects in the cohort.

* **Project Completion:**
  * NutriTrack fully deployed and operational.
  * All documentation complete and bilingual.
  * GitHub repository public with comprehensive README.
  * Workshop ready for others to follow.

* **Personal Growth:**
  * Mastered 10+ AWS services.
  * Gained experience in end-to-end project development.
  * Improved presentation and documentation skills.
  * Built strong network with AWS professionals.

### Overall Internship Summary

**12-Week Journey Highlights:**

| Phase          | Weeks | Key Accomplishments                                         |
| -------------- | ----- | ----------------------------------------------------------- |
| Foundation     | 1-2   | Team setup, AWS basics, lab practice, idea brainstorm       |
| Exploration    | 3-4   | Project selection (NutriTrack), AWS re:Invent event         |
| Design         | 5-6   | AI pipeline research, proposal approval, pivot to dual-method |
| Break & Study  | 7     | Tết holiday, self-study HA architecture, ALB, Auto Scaling  |
| Implementation | 8-9   | FastAPI backend, dual-method food analysis, label OCR, 3-tier barcode cache |
| Deployment     | 10-11 | ECS Fargate ARM, CI/CD, CSV token optimization, cache crawling |
| Finalization   | 12    | Private ECS + VPC Endpoints (no NAT), S3 sync, presentation |

**AWS Services Mastered:**
* ECS Fargate (ARM64 + FARGATE_SPOT), ECR, S3, IAM
* VPC, ALB, Target Groups, Auto Scaling (Min=1, Max=10)
* VPC Endpoints: Bedrock Runtime, S3 (Gateway), ECR API/DKR, Secrets Manager, CloudWatch Logs
* Amazon Bedrock (VLM/LLM via VPC Endpoint)
* Terraform, GitHub Actions CI/CD (6-job pipeline: Scan → Test → Build → Cache Sync → Deploy → Summary)

**Architecture:**
* Internet Gateway → Public Subnets (ALB) → Target Group + Auto Scaling → Private Subnets (ECS Fargate) → VPC Endpoints (Bedrock, S3, ECR, Secrets Manager, CloudWatch)
* **No NAT Gateway** — 100% private via VPC Endpoints for cost optimization
* 2 AZs: private-subnet-ecs01/02 + public-subnet-alb01/02

**Project Statistics:**
* 3 API pipelines: /analyze-food (dual-method), /analyze-label (VLM OCR), /scan-barcode (3-tier cache)
* Dual-method food analysis: "manual" (pure VLM + DB lookup) and "tools" (LLM tool-use with get_batch)
* Label OCR: exact nutrition facts extraction → 4 CSV tables (product, nutrients, ingredients, allergens)
* Barcode: 3-tier cache L1 LRU RAM (256) → L2 disk JSON → L3 API (Avocavo/OpenFoodFacts/USDA)
* Image compression: 768px, JPEG q75, force compress > 200KB → token savings across all pipelines
* CSV output format: ~60% token reduction vs JSON
* < 100ms API response time (async job return via HTTP 202)
* < 5s background processing start

### Final Reflection

This 12-week internship at AWS Vietnam through the FCJ program has been a truly transformative experience. As the AI + DevOps + Backend engineer for Team NeuraX, I went from learning basic AWS services in Week 1 to deploying a production-ready, fully-private ECS architecture with automated CI/CD and VPC Endpoints in Week 12. The journey taught me:

1. **Architecture matters more than code** — choosing private ECS + VPC Endpoints over NAT Gateway saved cost while keeping the architecture secure and fully private
2. **Token optimization is real engineering** — CSV output (~60% savings), image compression (768px), and prompt engineering each reduced Bedrock costs significantly
3. **Multi-tier caching is essential for AI APIs** — the L1 LRU → L2 disk → L3 API hierarchy dramatically reduced latency and external API calls
4. **Dual-method approach gives flexibility** — pure VLM prompt (fast) vs tool-use loop (accurate) lets users choose the right trade-off
5. **VPC Endpoints > NAT Gateway** — direct private connectivity for Bedrock, S3, ECR, Secrets Manager, CloudWatch without any NAT costs

I am grateful to the FCJ mentors, AWS Solution Architects, and my Team NeuraX colleagues for pushing me to grow. This internship didn't just teach me cloud — it taught me how to think like an engineer. The cloud journey continues! ☁️🚀
