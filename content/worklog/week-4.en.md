### Week 4 Objectives

* Officially finalize and approve NutriTrack as the team project.
* Attend AWS re:Invent 2025 Recap Event at AWS Vietnam Office.
* Begin detailed architecture design for NutriTrack.
* Learn Amazon Cognito and S3 advanced features.

### Tasks carried out this week

| Day | Task                                                                                                                                                                                                                      | Start Date | Completion Date | Reference Material                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------- | ---------------------------------------------------- |
| 1   | - Team Meeting: Final Project Decision <br>&emsp; + Presented refined NutriTrack proposal <br>&emsp; + Unanimous vote to proceed <br>&emsp; + Assigned roles: AI + DevOps + Backend (me), Frontend (2), AI/ML (1), PM (1) | 26/01/2026 | 26/01/2026      | [Proposal v2.0]                                      |
| 2   | - **AWS re:Invent 2025 Recap Event** <br>&emsp; + Location: AWS Office (Floor 26 & 36) <br>&emsp; + Full-day event with 5 technical sessions <br>&emsp; + Networking with AWS Solution Architects                         | 27/01/2026 | 27/01/2026      | [Event Notes]                                        |
| 3   | - Event Recap & Knowledge Sharing <br>&emsp; + Documented key learnings from re:Invent <br>&emsp; + Shared insights about Bedrock Agents with team <br>&emsp; + Explored SageMaker Unified Studio relevance               | 28/01/2026 | 28/01/2026      | [Internal Wiki]                                      |
| 4   | - Deep Dive: Amazon Cognito <br>&emsp; + User Pools vs Identity Pools <br>&emsp; + JWT token management <br>&emsp; + Social login integration patterns                                                                    | 29/01/2026 | 29/01/2026      | [Cognito Docs](https://docs.aws.amazon.com/cognito/) |
| 5   | - Architecture Design Session <br>&emsp; + Created high-level architecture diagram <br>&emsp; + Selected core AWS services for NutriTrack <br>&emsp; + Defined data flow and API structure                                | 30/01/2026 | 30/01/2026      | [Architecture Draft v1]                              |
| 6-7 | - S3 Advanced Features Study <br>&emsp; + S3 Event Notifications <br>&emsp; + S3 Lifecycle Policies <br>&emsp; + S3 Transfer Acceleration <br>&emsp; + Updated website with Week 4 content                                | 31/01/2026 | 01/02/2026      | [S3 Docs](https://docs.aws.amazon.com/s3/)           |

### Week 4 Achievements

* **Project Milestone:**
  * **NutriTrack officially approved** as the team's capstone project.
  * Defined project scope: AI-powered nutrition tracking with food recognition from photos.
  * My assigned roles: **AI Integration + DevOps + Backend API** — core technical responsibilities.

* **AWS re:Invent 2025 Recap Event Learnings:**
  * **Amazon Bedrock & Nova Models:** Learned about Nova models and fine-tuning capabilities.
  * **Bedrock Agents (Agentic AI):** Understood Orchestration/Flow, Memory, Policy/Guardrails — relevant to our tool-use loop design.
  * **SageMaker Unified Studio:** Discovered the unified IDE for Data Engineers, Data Scientists, and AI Engineers.
  * **Amazon S3 Updates:** Learned about S3 Tables (Iceberg support) and S3 Vector for native vector storage.
  * **OpenSearch Agentic Search:** MCP integration and specialized agents.

* **Technical Knowledge:**
  * Mastered Amazon Cognito authentication patterns — particularly JWT flow.
  * Understood S3 advanced features relevant to NutriTrack (image upload, lifecycle).

### Challenges & Lessons

* **Challenges:**
  * Information overload from AWS re:Invent event (5 sessions in one day).
  * Mapping new services to NutriTrack requirements required careful evaluation.

* **Solutions:**
  * Created structured notes during each session with "Relevance to NutriTrack" column.
  * Team review meeting the next day to filter actionable insights.

* **Lessons Learned:**
  * AWS continuously innovates; staying updated is essential for architecture decisions.
  * Bedrock Agents could be a future enhancement for NutriTrack (conversational meal planning).

### Next Week Plan

* Start Proposal documentation with detailed architecture and timeline.
* Set up AWS development environment (IAM roles, S3 buckets).
* Begin research on AI pipeline: food detection → nutrition analysis.
* Study VLM (Vision-Language Models) for food recognition use case.
