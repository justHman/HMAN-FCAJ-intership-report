# Sharing and Feedback

## 1. Feelings about the program

The First Cloud AI Journey internship program pushed me well beyond my comfort zone. Building 3 full API pipelines — food analysis with 2 methods (pure VLM prompt vs LLM tool-use loop), label OCR with exact nutrition facts extraction into structured CSV, and barcode scanning with a 3-tier cache hierarchy (L1 LRU RAM → L2 disk JSON → L3 API fallback across USDA, OpenFoodFacts, Avocavo) — all deployed on a private ECS Fargate architecture with VPC Endpoints and no NAT Gateway, was an intense but incredibly rewarding challenge.

---

## 2. Satisfaction level

Highly satisfied (9/10). The program gave freedom to optimize architecture deeply — from choosing CSV output format to reduce LLM tokens by ~60%, to implementing image compression (768px, JPEG q75) for Bedrock cost savings, to designing a fully private VPC with VPC Endpoints for Bedrock Runtime, S3, ECR, Secrets Manager, and CloudWatch instead of using NAT Gateway. The weekly check-ins provided enough structure while respecting engineering autonomy.

---

## 3. Knowledge gained

Throughout the program, I acquired deep knowledge in:
- **AWS Private Networking:** VPC with 2 AZs, public subnets (ALB) + private subnets (ECS), VPC Endpoints (Bedrock Runtime, S3 Gateway, ECR API/DKR, Secrets Manager, CloudWatch Logs), no NAT Gateway — 100% private egress.
- **Container Hosting:** ECS Fargate (ARM64 + FARGATE_SPOT), Target Groups, Auto Scaling (Min=1, Max=10), ECR image registry.
- **Backend API:** FastAPI with JWT auth (jose, service claim validation), async BackgroundTasks, ThreadPool (AnyIO 100 threads), job store with UUID tracking, HTTP 202 immediate response pattern.
- **AI/LLM Integration:** Dual-method food analysis — (1) "manual" pure VLM prompt → CSV output → optional USDA cross-validation, (2) "tools" LLM tool-use loop with get_batch tool calling for USDA batch nutrition lookup. Label OCR: OCRER model extracts exact nutrition facts into 4 CSV tables (product, nutrients, ingredients, allergens).
- **Token Optimization:** CSV output format (~60% reduction vs JSON), image compression via prepare_image_for_bedrock() (768px max, JPEG q75, force compress > 200KB), prompt engineering with compact rules ([ROLE], [TASK], [OUTPUT]).
- **Caching:** 3-tier barcode cache (L1 LRU OrderedDict 256 slots → L2 disk JSON files per client → L3 API fallback with short-circuit), 30-day TTL, negative caching, L2→L1 and L3→L1 promotion, S3 cache sync in CI/CD.
- **CI/CD:** GitHub Actions 6-job pipeline (Security Scan → Test → Build & Push ECR → S3 Cache Sync → Deploy ECS → Summary), Terraform IaC for infrastructure provisioning.

---

## 4. Skills improved

Beyond technical skills, I significantly improved my ability to make architectural trade-off decisions — choosing private ECS + VPC Endpoints over NAT Gateway for cost and security, dual-method food analysis (fast vs accurate), and CSV over JSON for token optimization. My end-to-end system design skills grew: from writing the first line of API code to deploying it in a fully private VPC with ALB routing and auto-scaling. I also gained deep experience in prompt engineering to control VLM/LLM output format precisely.

---

## 5. Areas for improvement (for the program)

1. More structured guidance for the initial exploration phase (Weeks 3-5) — having too many options without clear direction can delay project momentum.
2. More real-world cost optimization exercises — understanding VPC Endpoint pricing vs NAT Gateway is critical but not obvious at first.
3. Consider adding a mid-program architecture review session with AWS Solution Architects to catch design issues early.

---

## 6. Would you recommend the program to friends? Why?

Absolutely. You build and deploy real production-grade AI systems on AWS, learn to optimize token costs and architecture trade-offs, and receive mentorship from AWS Solution Architects. The program covers the full stack: from LLM prompt engineering to private VPC networking, from cache design to CI/CD automation. For anyone aiming to become a cloud or AI engineer, the FCJ internship is one of the best starting points.
