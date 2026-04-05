### Week 7 Objectives

* Lunar New Year (Tết) holiday break — self-study period.
* Study Load Balancer, ALB, and Auto Scaling concepts.
* Learn Target Groups and health check configurations.
* Design High Availability (HA) architecture for NutriTrack.

### Tasks carried out this week

| Day | Task | Start Date | Completion Date | Reference Material |
| --- | --- | --- | --- | --- |
| 1 | - **Tết Holiday** (Lunar New Year) <br>&emsp; + National holiday — no official work <br>&emsp; + Light reading on AWS documentation | 16/02/2026 | 16/02/2026 | - |
| 2-3 | - **Tết Holiday** (continued) <br>&emsp; + Family time and celebrations <br>&emsp; + Reviewed AWS Well-Architected Framework during downtime | 17/02/2026 | 18/02/2026 | [Well-Architected](https://docs.aws.amazon.com/wellarchitected/) |
| 4 | - Self-Study: Elastic Load Balancing <br>&emsp; + Application Load Balancer (ALB): HTTP/HTTPS routing, path-based routing <br>&emsp; + Network Load Balancer (NLB): TCP/UDP, ultra-low latency <br>&emsp; + ALB vs NLB comparison for different use cases | 19/02/2026 | 19/02/2026 | [ELB Docs](https://docs.aws.amazon.com/elasticloadbalancing/) |
| 5 | - Self-Study: Auto Scaling & Target Groups <br>&emsp; + Auto Scaling policies: target tracking, step scaling, scheduled <br>&emsp; + Target Groups: instance, IP, Lambda targets <br>&emsp; + Health checks: ELB health check vs EC2 status check | 20/02/2026 | 20/02/2026 | [Auto Scaling Docs](https://docs.aws.amazon.com/autoscaling/) |
| 6 | - HA Architecture Design <br>&emsp; + Multi-AZ deployment pattern <br>&emsp; + ALB + Auto Scaling + ECS Fargate for NutriTrack <br>&emsp; + Designed failover and self-healing mechanisms | 21/02/2026 | 21/02/2026 | [Architecture Notes] |
| 7 | - Development Preparation <br>&emsp; + Set up FastAPI project structure locally <br>&emsp; + Installed Python dependencies for AI/ML <br>&emsp; + Prepared development environment for coding sprint | 22/02/2026 | 22/02/2026 | - |

### Week 7 Achievements

* **Load Balancing Knowledge:**
  * Understood ALB for HTTP/HTTPS with path-based and host-based routing.
  * Learned NLB for high-performance TCP/UDP workloads.
  * Chose ALB for NutriTrack: best fit for REST API routing.

* **Auto Scaling & Target Groups:**
  * Mastered Auto Scaling policies and when to use each type.
  * Understood Target Groups as the connection between ALB and backend services.
  * Learned health check configuration for reliable service discovery.

* **HA Architecture:**
  * Designed Multi-AZ architecture: ALB → Auto Scaling Group → ECS Fargate tasks across 2 AZs.
  * Planned for self-healing: unhealthy tasks automatically replaced.
  * Estimated cost vs. availability trade-offs.

* **Development Prep:**
  * FastAPI project skeleton ready with proper directory structure.
  * All Python dependencies installed and tested locally.

### Challenges & Lessons

* **Challenges:**
  * Maintaining productivity during a long holiday break is difficult.
  * Understanding the relationship between ALB, Target Groups, and Auto Scaling requires careful study.

* **Solutions:**
  * Set small daily learning goals during the break (1-2 hours of reading).
  * Drew architecture diagrams to visualize the ALB → Target Group → ECS flow.

* **Lessons Learned:**
  * HA architecture is not just about redundancy — it's about automated recovery.
  * Target Groups are the key connector that makes ALB + Auto Scaling work together.

### Next Week Plan

* Start backend development: FastAPI with async processing.
* Implement JWT authentication for API security.
* Build the initial project structure with i18n support.
* Begin implementing LLM/VLM tool-use loop for food analysis.
