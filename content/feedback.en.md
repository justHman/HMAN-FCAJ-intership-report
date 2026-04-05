# Sharing and Feedback

## 1. Feelings about the program

The First Cloud AI Journey internship program has been an incredibly challenging and rewarding experience. Over the past 12 weeks, I took on core roles spanning AI Integration, DevOps, and Backend API development for the NutriTrack project. The program pushed me beyond my comfort zone — from learning basic AWS services to deploying a production-ready API with automated CI/CD pipelines. The hands-on nature of the program made every week feel like real-world engineering rather than academic exercises.

---

## 2. Satisfaction level

I am highly satisfied with the program (9/10). The flexibility to explore different approaches — such as pivoting from a multi-model vision pipeline to an LLM tool-use loop — was invaluable. The program provided enough structure through weekly check-ins while giving freedom to experiment with different AWS services and deployment strategies. The only area I'd rate slightly lower is the initial onboarding period, which could benefit from more hands-on guidance for complex services.

---

## 3. Knowledge gained

Throughout the program, I acquired deep knowledge in:
- **AWS Infrastructure:** VPC, Subnets, VPC Endpoints, ALB, NAT Gateway, NAT Instance (for cost optimization), Auto Scaling, Target Groups, and ECS Fargate (ARM + Spot).
- **HA & Scaling:** Designed and built Highly Available architectures with automated load balancing and auto scaling across multiple AZs.
- **DevOps & CI/CD:** End-to-end automated deployment pipelines using Terraform, GitHub Actions, with deployments to both AWS ECS and Fly.io.
- **Backend APIs:** Built secure async API with FastAPI, JWT authentication, background job processing with ThreadPool, achieving < 100ms response time and < 5s background processing start.
- **AI/LLM Integration:** Implemented LLM/VLM tool-use loops, optimized prompts, enforced CSV output format for token reduction (~60%), and batch tool calling for reduced latency.
- **Caching:** Built dual-layer caching system (L1 user-level in-memory cache, L2 file-based persistent cache) with cache crawling for pre-population.

---

## 4. Skills improved

Beyond technical skills, I significantly improved my ability to make architectural trade-off decisions — such as choosing ECS over Lambda for AI workloads, or NAT Instance over NAT Gateway for cost savings. My end-to-end system design skills grew substantially: from writing the first line of API code to deploying it in a private VPC with ALB routing. I also improved at prompt engineering and understanding LLM behavior patterns.

---

## 5. Areas for improvement (for the program)

1. More structured guidance for the initial exploration phase (Weeks 3-5) — having too many options without clear direction can delay project momentum.
2. More real-world cost optimization exercises — understanding AWS pricing is critical but often overlooked in favor of feature development.
3. Consider adding a mid-program architecture review session with AWS Solution Architects.

---

## 6. Would you recommend the program to friends? Why?

Absolutely. The FCJ internship program offers a unique combination of theoretical AWS knowledge and real-world project implementation that is hard to find elsewhere. You build and deploy actual production-grade applications on AWS, work with cutting-edge AI models, and learn DevOps practices — all within a supportive mentorship environment. For anyone interested in cloud engineering or AI infrastructure, this program is one of the best starting points.
