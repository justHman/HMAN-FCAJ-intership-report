export type Language = 'en' | 'vi';

export interface BilingualText {
    en: string;
    vi: string;
}

export const content = {
    hero: {
        greeting: {
            en: 'Hello, I\'m',
            vi: 'Xin chào, tôi là',
        },
        tagline: {
            en: 'Building AI-powered Nutrition APIs on AWS — Food Analysis, Label OCR, Barcode Scanning & Multi-tier Cache',
            vi: 'Xây dựng API Dinh dưỡng AI-powered trên AWS — Phân tích Đồ ăn, OCR Nhãn, Quét Barcode & Cache Đa tầng',
        },
        cta: {
            en: 'View My Journey',
            vi: 'Xem Hành Trình',
        },
    },
    worklog: {
        title: {
            en: 'Weekly Worklog',
            vi: 'Nhật Ký Công Việc',
        },
        subtitle: {
            en: '12 weeks of building NutriTrack — AI, DevOps & Backend',
            vi: '12 tuần xây dựng NutriTrack — AI, DevOps & Backend',
        },
        weeks: [
            {
                week: 1,
                title: { en: 'Kickoff & Onboarding', vi: 'Kickoff & Tiếp nhận' },
                description: {
                    en: 'Attended the FCJ Kickoff, formed Team NeuraX, set up AWS account and CLI, completed 5 hands-on labs for $100 credits.',
                    vi: 'Tham dự Kickoff FCJ, lập Team NeuraX, thiết lập AWS account và CLI, hoàn thành 5 lab thực hành để nhận $100 credits.',
                },
                highlights: { en: ['Team NeuraX Formed', 'AWS CLI Setup', '5 Labs & $100 Credits'], vi: ['Thành lập Team NeuraX', 'Cài đặt AWS CLI', '5 Labs & $100 Credits'] },
            },
            {
                week: 2,
                title: { en: 'AWS Deep Dive', vi: 'AWS Chuyên Sâu' },
                description: {
                    en: 'Brainstormed project ideas, deep-dived into EC2, S3, VPC, RDS, Lambda, and High Availability design with ALB and Auto Scaling.',
                    vi: 'Brainstorm ý tưởng dự án, tìm hiểu sâu EC2, S3, VPC, RDS, Lambda, thiết kế HA với ALB và Auto Scaling.',
                },
                highlights: { en: ['Idea Brainstorm', 'VPC & HA Design', 'Coursera Week 1'], vi: ['Brainstorm idea', 'VPC & Thiết kế HA', 'Coursera Tuần 1'] },
            },
            {
                week: 3,
                title: { en: 'Bedrock & Project Concept', vi: 'Bedrock & Ý tưởng Dự án' },
                description: {
                    en: 'Deep-dived into Amazon Bedrock and RAG architecture. Team merged SnapChef + NutriTrack into one concept: AI-powered food recognition and nutrition tracking.',
                    vi: 'Tìm hiểu sâu về Amazon Bedrock và RAG. Team kết hợp SnapChef + NutriTrack thành 1 concept: nhận diện thực phẩm và theo dõi dinh dưỡng bằng AI.',
                },
                highlights: { en: ['Amazon Bedrock Research', 'RAG Architecture', 'NutriTrack Concept'], vi: ['Nghiên cứu Amazon Bedrock', 'Kiến trúc RAG', 'Concept NutriTrack'] },
            },
            {
                week: 4,
                title: { en: 'Project Approved & re:Invent', vi: 'Dự án Phê duyệt & re:Invent' },
                description: {
                    en: 'NutriTrack officially approved. Attended AWS re:Invent 2025 Recap at AWS Vietnam Office — 5 sessions on Bedrock Agents, SageMaker Unified Studio, S3 Vector, and more.',
                    vi: 'NutriTrack chính thức được phê duyệt. Tham dự AWS re:Invent 2025 Recap tại văn phòng AWS — 5 phiên kỹ thuật về Bedrock Agents, SageMaker Unified Studio, S3 Vector.',
                },
                highlights: { en: ['NutriTrack Approved', 'AWS re:Invent Recap', 'Role: AI+DevOps+Backend'], vi: ['NutriTrack được duyệt', 'AWS re:Invent Recap', 'Vai trò: AI+DevOps+Backend'] },
            },
            {
                week: 5,
                title: { en: 'AI Pipeline Research', vi: 'Nghiên cứu AI Pipeline' },
                description: {
                    en: 'Wrote the NutriTrack Proposal and designed a multi-step AI pipeline (detect → segment → weight → USDA lookup). Hit OOM errors — pivoted approach.',
                    vi: 'Viết NutriTrack Proposal, thiết kế multi-step AI pipeline (detect → segment → weight → USDA). Gặp lỗi OOM — cần pivot hướng tiếp cận.',
                },
                highlights: { en: ['Proposal Writing', 'Pipeline Design', 'OOM Issue Discovered'], vi: ['Viết Proposal', 'Thiết kế Pipeline', 'Phát hiện lỗi OOM'] },
            },
            {
                week: 6,
                title: { en: 'Proposal Approved & Pivot', vi: 'Proposal Được Duyệt & Pivot' },
                description: {
                    en: 'Proposal approved by mentor. Pivoted AI approach to LLM/VLM tool-use loop. Studied VPC Endpoints, NAT Gateway vs NAT Instance, and 3 nutrition data APIs.',
                    vi: 'Proposal được mentor phê duyệt. Pivot sang LLM/VLM tool-use loop. Tìm hiểu VPC Endpoints, NAT Gateway vs NAT Instance, và 3 nutrition APIs.',
                },
                highlights: { en: ['Proposal Approved', 'VLM Tool-Use Loop', 'NAT Instance (Cost Saving)'], vi: ['Proposal được duyệt', 'VLM Tool-Use Loop', 'NAT Instance (Tiết kiệm chi phí)'] },
            },
            {
                week: 7,
                title: { en: 'Tết Break & HA Study', vi: 'Nghỉ Tết & Học HA' },
                description: {
                    en: 'Lunar New Year break. Self-studied Elastic Load Balancer (ALB), Auto Scaling Groups, Target Groups, and designed the High Availability architecture for NutriTrack.',
                    vi: 'Nghỉ Tết Nguyên Đán. Tự học ALB, Auto Scaling Groups, Target Groups và thiết kế kiến trúc High Availability cho NutriTrack.',
                },
                highlights: { en: ['ALB & Auto Scaling', 'Target Groups', 'HA Architecture Design'], vi: ['ALB & Auto Scaling', 'Target Groups', 'Thiết kế HA Architecture'] },
            },
            {
                week: 8,
                title: { en: 'FastAPI Backend & Dual-Method Food Analysis', vi: 'FastAPI Backend & Phân tích Đồ ăn 2 Phương pháp' },
                description: {
                    en: 'Built FastAPI backend with JWT auth, ThreadPool for async AI inference. Implemented 2 food analysis methods: (1) "manual" — pure VLM prompt + USDA database lookup for cross-validation, (2) "tools" — LLM tool-use loop with get_batch tool calling.',
                    vi: 'Xây dựng FastAPI backend với JWT auth, ThreadPool cho async AI inference. Implement 2 phương pháp phân tích đồ ăn: (1) "manual" — thuần VLM prompt + tra cứu USDA để cross-validate, (2) "tools" — LLM tool-use loop với get_batch tool calling.',
                },
                highlights: { en: ['FastAPI + JWT Auth', '2 Food Analysis Methods', '< 100ms API Response'], vi: ['FastAPI + JWT Auth', '2 Phương pháp Phân tích', 'API Response < 100ms'] },
            },
            {
                week: 9,
                title: { en: 'Label OCR, Barcode & Cache System', vi: 'OCR Nhãn, Barcode & Hệ thống Cache' },
                description: {
                    en: 'First GitHub commit. Implemented label OCR pipeline (image → VLM extract exact nutrition facts → structured CSV output). Built barcode scanning pipeline with 3-tier cache (L1 LRU RAM → L2 disk JSON → L3 API fallback). Image compression (768px, JPEG q75) for token reduction.',
                    vi: 'Commit đầu tiên lên GitHub. Implement pipeline OCR nhãn (image → VLM trích xuất chính xác bảng nutrition facts → CSV output). Xây dựng pipeline scan barcode với cache 3 tầng (L1 LRU RAM → L2 disk JSON → L3 API fallback). Nén ảnh (768px, JPEG q75) giảm token.',
                },
                highlights: { en: ['Label OCR Pipeline', 'Barcode 3-Tier Cache', 'Image Compression'], vi: ['Pipeline OCR Nhãn', 'Barcode Cache 3 Tầng', 'Nén Ảnh'] },
            },
            {
                week: 10,
                title: { en: 'ECS Deploy & 3 API Pipelines', vi: 'ECS Deploy & 3 API Pipelines' },
                description: {
                    en: 'Deployed to ECS Fargate ARM + Spot. Finalized 3 full API pipelines: /analyze-food (2 methods), /analyze-label (VLM OCR → exact nutrition facts extraction), /scan-barcode (L1→L2→L3 cache hierarchy with 3 clients: USDA, OpenFoodFacts, Avocavo). All pipelines use CSV output format and image compression.',
                    vi: 'Deploy lên ECS Fargate ARM + Spot. Hoàn thiện 3 API pipelines: /analyze-food (2 methods), /analyze-label (VLM OCR → trích xuất chính xác nutrition facts), /scan-barcode (cache L1→L2→L3 với 3 clients: USDA, OpenFoodFacts, Avocavo). Tất cả dùng CSV output và nén ảnh.',
                },
                highlights: { en: ['ECS Fargate ARM+Spot', '3 API Pipelines', 'CSV Output + Compression'], vi: ['ECS Fargate ARM+Spot', '3 API Pipelines', 'CSV Output + Nén ảnh'] },
            },
            {
                week: 11,
                title: { en: 'CI/CD & Token Optimization', vi: 'CI/CD & Tối ưu Token' },
                description: {
                    en: 'Set up GitHub Actions CI/CD for ECS. Optimized VLM prompts: enforced CSV output format for both food & label analysis (~60% token reduction). Cache crawling pipeline to pre-populate L2 disk cache. Added Fly.io deployment and started Terraform IaC.',
                    vi: 'Setup GitHub Actions CI/CD cho ECS. Tối ưu VLM prompts: ép CSV output format cho cả food & label analysis (giảm ~60% token). Cache crawling pipeline để pre-populate L2 disk cache. Thêm Fly.io và bắt đầu Terraform IaC.',
                },
                highlights: { en: ['GitHub Actions CI/CD', 'CSV Format (60% Tokens↓)', 'Cache Crawling Pipeline'], vi: ['GitHub Actions CI/CD', 'CSV Format (giảm 60% Token)', 'Pipeline Cache Crawling'] },
            },
            {
                week: 12,
                title: { en: 'Private ECS Architecture & Final Review', vi: 'Kiến trúc Private ECS & Báo cáo Cuối' },
                description: {
                    en: 'Deployed final architecture: Internet Gateway → Public Subnets (ALB) → Target Group + Auto Scaling → Private Subnets (ECS Fargate + VPC Endpoints for Bedrock, S3, ECR, Secrets Manager, CloudWatch). No NAT Gateway — 100% private via VPC Endpoints. S3 cache sync in CI/CD. Final presentation.',
                    vi: 'Deploy kiến trúc cuối: Internet Gateway → Public Subnets (ALB) → Target Group + Auto Scaling → Private Subnets (ECS Fargate + VPC Endpoints cho Bedrock, S3, ECR, Secrets Manager, CloudWatch). Không NAT Gateway — 100% private qua VPC Endpoints. S3 cache sync trong CI/CD. Thuyết trình cuối.',
                },
                highlights: { en: ['Private ECS + VPC Endpoints', 'No NAT (100% Private)', 'Final Presentation'], vi: ['Private ECS + VPC Endpoints', 'Không NAT (100% Private)', 'Thuyết trình cuối'] },
            },
        ],
    },
    proposal: {
        title: {
            en: 'Project Proposal',
            vi: 'Đề Xuất Dự Án',
        },
        subtitle: {
            en: 'NutriTrack — AI-Powered Nutrition Tracking API',
            vi: 'NutriTrack — API Theo dõi Dinh dưỡng bằng AI',
        },
        overview: {
            en: 'NutriTrack is an AI-powered nutrition tracking backend with 3 core pipelines: (1) Food Analysis with dual methods — pure VLM prompt + database cross-validation, or LLM tool-use loop with get_batch tool calling, (2) Label OCR — exact extraction of nutrition facts labels into structured data, (3) Barcode Scanning — 3-tier cache hierarchy (L1 RAM → L2 disk → L3 API) across 3 nutrition databases. All pipelines optimize tokens via CSV output format and image compression.',
            vi: 'NutriTrack là backend theo dõi dinh dưỡng bằng AI với 3 pipelines chính: (1) Phân tích Đồ ăn với 2 phương pháp — thuần VLM prompt + cross-validate database, hoặc LLM tool-use loop với get_batch, (2) OCR Nhãn — trích xuất chính xác bảng thành phần dinh dưỡng, (3) Quét Barcode — cache 3 tầng (L1 RAM → L2 disk → L3 API) qua 3 database. Tất cả tối ưu token bằng CSV output và nén ảnh.',
        },
        objectives: [
            {
                en: 'Dual-method food analysis: (1) VLM prompt + USDA/external API cross-validation, (2) LLM tool-use loop with get_batch tool calling and batch nutrition lookup',
                vi: 'Phân tích đồ ăn 2 phương pháp: (1) VLM prompt + cross-validate USDA/API, (2) LLM tool-use loop với get_batch tool calling và tra cứu dinh dưỡng batch',
            },
            {
                en: 'Nutrition label OCR: VLM extracts exact nutrition facts tables into structured CSV (product info, nutrients, ingredients, allergens)',
                vi: 'OCR nhãn dinh dưỡng: VLM trích xuất chính xác bảng nutrition facts thành CSV có cấu trúc (thông tin SP, dinh dưỡng, thành phần, dị ứng)',
            },
            {
                en: 'Barcode scanning with 3-tier cache (L1 LRU RAM → L2 disk JSON → L3 API) across USDA, OpenFoodFacts, Avocavo + S3 cache sync',
                vi: 'Quét barcode với cache 3 tầng (L1 LRU RAM → L2 disk JSON → L3 API) trên USDA, OpenFoodFacts, Avocavo + đồng bộ S3 cache',
            },
            {
                en: 'Token & cost optimization: CSV output (~60% reduction), image compression (768px, JPEG q75), prompt engineering for minimal token usage',
                vi: 'Tối ưu token & chi phí: CSV output (giảm ~60%), nén ảnh (768px, JPEG q75), prompt engineering để giảm token tối đa',
            },
            {
                en: 'Private ECS architecture: Internet Gateway → ALB (public) → Target Group + Auto Scaling → ECS Fargate ARM+Spot (private) → VPC Endpoints (Bedrock, S3, ECR, Secrets Manager, CloudWatch) — No NAT Gateway',
                vi: 'Kiến trúc Private ECS: Internet Gateway → ALB (public) → Target Group + Auto Scaling → ECS Fargate ARM+Spot (private) → VPC Endpoints (Bedrock, S3, ECR, Secrets Manager, CloudWatch) — Không NAT Gateway',
            },
        ],
        services: [
            { name: 'Amazon ECS Fargate', purpose: { en: 'Container hosting (ARM64 + FARGATE_SPOT)', vi: 'Hosting container (ARM64 + FARGATE_SPOT)' } },
            { name: 'Amazon Bedrock', purpose: { en: 'VLM/LLM for food analysis & label OCR (via VPC Endpoint)', vi: 'VLM/LLM cho phân tích đồ ăn & OCR nhãn (qua VPC Endpoint)' } },
            { name: 'Amazon S3', purpose: { en: 'L2 cache sync & media storage (Gateway Endpoint)', vi: 'Đồng bộ cache L2 & lưu trữ media (Gateway Endpoint)' } },
            { name: 'AWS ALB', purpose: { en: 'Load balancing in public subnets → Target Group → ECS', vi: 'Cân bằng tải ở public subnets → Target Group → ECS' } },
            { name: 'AWS Secrets Manager', purpose: { en: 'API keys storage (via VPC Endpoint)', vi: 'Lưu trữ API keys (qua VPC Endpoint)' } },
            { name: 'Amazon ECR', purpose: { en: 'Docker image registry (via VPC Endpoint)', vi: 'Registry Docker image (qua VPC Endpoint)' } },
            { name: 'Amazon CloudWatch', purpose: { en: 'Monitoring & logging (via VPC Endpoint)', vi: 'Giám sát & ghi log (qua VPC Endpoint)' } },
            { name: 'AWS Auto Scaling', purpose: { en: 'ECS service auto-scaling (Min=1, Max=10) with CloudWatch alarms: CPU >70% → scale-out, CPU <20% → scale-in', vi: 'Tự động co giãn ECS service (Min=1, Max=10) với CloudWatch alarms: CPU >70% → tăng task, CPU <20% → giảm task' } },
        ],
    },
    events: {
        title: {
            en: 'Events Participated',
            vi: 'Sự Kiện Tham Gia',
        },
        subtitle: {
            en: 'Technical events attended during the internship',
            vi: 'Các sự kiện kỹ thuật trong quá trình thực tập',
        },
        list: [
            {
                name: { en: 'AWS re:Invent 2025 Recap — Vietnam Edition', vi: 'AWS re:Invent 2025 Recap — Phiên bản Việt Nam' },
                date: '2026-01-27',
                location: { en: 'AWS Vietnam Office (Floor 26 & 36), HCMC', vi: 'Văn phòng AWS Việt Nam (Tầng 26 & 36), TP.HCM' },
                role: { en: 'Attendee', vi: 'Người tham dự' },
                description: { en: '5 technical sessions: Bedrock Agents, SageMaker Unified Studio, S3 Vector, OpenSearch Agentic Search, and AI Infrastructure.', vi: '5 phiên kỹ thuật: Bedrock Agents, SageMaker Unified Studio, S3 Vector, OpenSearch Agentic Search, và AI Infrastructure.' },
            },
            {
                name: { en: 'AWS Cloud Mastery 1', vi: 'AWS Cloud Mastery 1' },
                date: '2026-03-14',
                location: { en: 'AWS Vietnam Office (Floor 26), HCMC', vi: 'Văn phòng AWS Việt Nam (Tầng 26), TP.HCM' },
                role: { en: 'Attendee', vi: 'Người tham dự' },
                description: { en: '3 sessions: Building AI Agents, Prompt Engineering & Serverless Architecture, Applying AI to Real Products (IoT + Rekognition, Textract).', vi: '3 phiên: Xây dựng AI Agents, Prompt Engineering & Serverless, Ứng dụng AI vào sản phẩm thực (IoT + Rekognition, Textract).' },
            },
        ],
    },
    workshop: {
        title: {
            en: 'Technical Workshop',
            vi: 'Workshop Kỹ Thuật',
        },
        subtitle: {
            en: 'Step-by-step guide to building NutriTrack API',
            vi: 'Hướng dẫn từng bước xây dựng NutriTrack API',
        },
        toc: [
            { id: 'overview', label: { en: 'Overview', vi: 'Tổng quan' } },
            { id: 'prerequisites', label: { en: 'Prerequisites', vi: 'Điều kiện tiên quyết' } },
            { id: 'architecture', label: { en: 'Architecture', vi: 'Kiến trúc' } },
            { id: 'step1', label: { en: 'Step 1: Setup', vi: 'Bước 1: Cài đặt' } },
            { id: 'step2', label: { en: 'Step 2: FastAPI', vi: 'Bước 2: FastAPI' } },
            { id: 'step3', label: { en: 'Step 3: AI Pipeline', vi: 'Bước 3: AI Pipeline' } },
            { id: 'step4', label: { en: 'Step 4: ECS Deploy', vi: 'Bước 4: Deploy ECS' } },
            { id: 'cleanup', label: { en: 'Clean Up', vi: 'Dọn dẹp' } },
        ],
    },
    evaluation: {
        title: {
            en: 'Self Evaluation',
            vi: 'Tự Đánh Giá',
        },
        subtitle: {
            en: 'Honest assessment of my performance and growth',
            vi: 'Đánh giá trung thực về hiệu suất và sự phát triển',
        },
        criteria: [
            { name: { en: 'Technical Knowledge', vi: 'Kiến thức Kỹ thuật' }, rating: 'good', comment: { en: 'Deep understanding of AWS private networking (VPC Endpoints, no NAT), ECS Fargate ARM+Spot, Bedrock VLM/LLM, and multi-tier caching', vi: 'Hiểu sâu AWS private networking (VPC Endpoints, không NAT), ECS Fargate ARM+Spot, Bedrock VLM/LLM, và cache đa tầng' } },
            { name: { en: 'Learning Ability', vi: 'Khả năng Học hỏi' }, rating: 'good', comment: { en: 'Quickly pivoted from multi-model pipeline to dual-method approach (manual + tool-use); adapted to private ECS with VPC Endpoints', vi: 'Nhanh chóng pivot từ multi-model pipeline sang dual-method (manual + tool-use); thích nghi với private ECS + VPC Endpoints' } },
            { name: { en: 'Proactivity', vi: 'Chủ động' }, rating: 'good', comment: { en: 'Self-driven: CSV output format (~60% token savings), image compression (768px), 3-tier cache with crawling, prompt optimization', vi: 'Tự giác: CSV output (~60% tiết kiệm token), nén ảnh (768px), cache 3 tầng với crawling, tối ưu prompt' } },
            { name: { en: 'Discipline', vi: 'Kỷ luật' }, rating: 'fair', comment: { en: 'Delivered milestones consistently, but work schedule was sometimes irregular with late-night coding sessions', vi: 'Hoàn thành milestone đúng hạn, nhưng lịch làm việc đôi khi không đều, hay code đêm khuya' } },
            { name: { en: 'Communication', vi: 'Giao tiếp' }, rating: 'fair', comment: { en: 'Technical decisions communicated clearly, but could improve on daily standup regularity', vi: 'Truyền đạt quyết định kỹ thuật rõ ràng, nhưng cần cải thiện tần suất daily standup' } },
            { name: { en: 'Teamwork', vi: 'Làm việc nhóm' }, rating: 'good', comment: { en: 'Collaborated across AI, DevOps, and backend; supported teammates with AWS guidance', vi: 'Phối hợp từ AI, DevOps đến backend; hỗ trợ thành viên về AWS' } },
            { name: { en: 'Problem Solving', vi: 'Giải quyết vấn đề' }, rating: 'good', comment: { en: 'Resolved OOM errors, API bottlenecks, image format bugs (P→RGB), ECS private networking issues', vi: 'Giải quyết lỗi OOM, bottleneck API, bug image format (P→RGB), vấn đề ECS private networking' } },
            { name: { en: 'Project Contribution', vi: 'Đóng góp Dự án' }, rating: 'good', comment: { en: 'Delivered 3 complete API pipelines, dual-method food analysis, 3-tier cache, CI/CD, and private ECS infrastructure', vi: 'Hoàn thành 3 API pipelines, phân tích đồ ăn 2 phương pháp, cache 3 tầng, CI/CD, và hạ tầng private ECS' } },
            { name: { en: 'Time Management', vi: 'Quản lý Thời gian' }, rating: 'fair', comment: { en: 'Met major deadlines but could better distribute workload instead of intense sprints near milestones', vi: 'Đáp ứng deadline lớn nhưng cần phân phối workload đều hơn thay vì sprint gấp gần milestone' } },
        ],
    },
    feedback: {
        title: {
            en: 'Sharing & Feedback',
            vi: 'Chia Sẻ & Phản Hồi',
        },
        subtitle: {
            en: 'Personal reflections on the FCJ program',
            vi: 'Suy nghĩ cá nhân về chương trình FCJ',
        },
        feeling: {
            en: 'The FCJ internship pushed me well beyond my comfort zone. Building 3 full API pipelines — food analysis with 2 methods (pure prompt vs tool-use), label OCR with exact nutrition facts extraction, and barcode scanning with a 3-tier cache — all deployed on a private ECS architecture with no NAT Gateway, was an intense but incredibly rewarding challenge.',
            vi: 'Chương trình FCJ đã đẩy tôi vượt ra ngoài vùng an toàn. Xây dựng 3 API pipeline hoàn chỉnh — phân tích đồ ăn 2 phương pháp (thuần prompt vs tool-use), OCR nhãn trích xuất chính xác nutrition facts, và quét barcode với cache 3 tầng — tất cả deploy trên kiến trúc private ECS không NAT Gateway, là thử thách khó nhưng cực kỳ xứng đáng.',
        },
        satisfaction: {
            en: 'Highly satisfied (9/10). The program gave freedom to optimize architecture deeply — from choosing CSV output to reduce LLM tokens by 60%, to implementing image compression for Bedrock cost savings, to designing a fully private VPC with VPC Endpoints instead of NAT Gateway.',
            vi: 'Rất hài lòng (9/10). Chương trình cho tự do tối ưu kiến trúc sâu — từ chọn CSV output giảm 60% LLM tokens, đến nén ảnh tiết kiệm chi phí Bedrock, đến thiết kế VPC hoàn toàn private với VPC Endpoints thay vì NAT Gateway.',
        },
        improvement: {
            en: 'More structured guidance in the exploration phase (Weeks 3-5) would help. Also, more real-world cost optimization exercises — understanding VPC Endpoint pricing vs NAT Gateway is critical but not obvious at first.',
            vi: 'Cần thêm hướng dẫn có cấu trúc trong giai đoạn exploration (Tuần 3-5). Cũng cần thêm bài tập tối ưu chi phí thực tế — hiểu giá VPC Endpoints vs NAT Gateway rất quan trọng nhưng ban đầu không rõ ràng.',
        },
        recommend: {
            en: 'Absolutely. You build and deploy real production-grade AI systems on AWS, learn to optimize token costs and architecture trade-offs, and receive mentorship from AWS Solution Architects. For anyone aiming to become a cloud or AI engineer, this is one of the best starting points.',
            vi: 'Chắc chắn rồi. Bạn sẽ xây dựng và deploy hệ thống AI production thật trên AWS, học cách tối ưu token cost và trade-offs kiến trúc, và được mentored bởi AWS Solution Architects. Với ai muốn trở thành cloud hoặc AI engineer, đây là một trong những điểm xuất phát tốt nhất.',
        },
    },
};
