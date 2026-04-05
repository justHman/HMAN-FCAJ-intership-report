import { Link } from 'react-router-dom';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { useLanguage } from '../contexts/LanguageContext';
import { loadContent } from '../utils/contentLoader';
import { AnimatedPage } from '../components/AnimatedPage';
import { SectionHeader } from '../components/SectionHeader';

// Worklog overview page - links to individual weeks
export function WorklogPage() {
    const { language } = useLanguage();

    const weeks = [
        { week: 1, task: { en: 'FCJ Kickoff, Team NeuraX setup, AWS account & CLI, 5 hands-on labs for $100 credits', vi: 'Kickoff FCJ, thành lập Team NeuraX, AWS account & CLI, 5 labs thực hành lấy $100 credits' } },
        { week: 2, task: { en: 'AWS deep dive: EC2, S3, VPC, RDS, Lambda, HA design with ALB & Auto Scaling', vi: 'AWS chuyên sâu: EC2, S3, VPC, RDS, Lambda, thiết kế HA với ALB & Auto Scaling' } },
        { week: 3, task: { en: 'Amazon Bedrock & RAG research, NutriTrack concept merged with SnapChef idea', vi: 'Nghiên cứu Bedrock & RAG, kết hợp SnapChef + NutriTrack thành concept AI-powered nutrition' } },
        { week: 4, task: { en: 'Project approved, attended AWS re:Invent 2025 Recap — 5 sessions on Bedrock Agents, S3 Vector...', vi: 'Dự án được duyệt, tham dự re:Invent 2025 Recap — 5 phiên về Bedrock Agents, S3 Vector...' } },
        { week: 5, task: { en: 'Wrote NutriTrack Proposal, designed multi-step AI pipeline — hit OOM errors, pivot needed', vi: 'Viết NutriTrack Proposal, thiết kế multi-step AI pipeline — gặp lỗi OOM, cần pivot' } },
        { week: 6, task: { en: 'Proposal approved, pivoted to LLM tool-use loop, studied VPC Endpoints & NAT options', vi: 'Proposal được duyệt, pivot sang LLM tool-use loop, nghiên cứu VPC Endpoints & NAT' } },
        { week: 7, task: { en: 'Lunar New Year break — self-studied ALB, Auto Scaling, Target Groups & HA architecture', vi: 'Nghỉ Tết Nguyên Đán — tự học ALB, Auto Scaling, Target Groups & kiến trúc HA' } },
        { week: 8, task: { en: 'FastAPI + JWT auth, dual-method food analysis (manual + tool-use), CSV output & image compression', vi: 'FastAPI + JWT auth, phân tích đồ ăn 2 phương pháp (manual + tool-use), CSV output & nén ảnh' } },
        { week: 9, task: { en: 'First GitHub commit, label OCR pipeline, barcode 3-tier cache (L1→L2→L3), Dockerfile', vi: 'Commit đầu tiên, pipeline OCR nhãn, barcode cache 3 tầng (L1→L2→L3), Dockerfile' } },
        { week: 10, task: { en: 'ECS Fargate ARM+Spot deploy, finalized 3 API pipelines: food, label, barcode', vi: 'Deploy ECS Fargate ARM+Spot, hoàn thiện 3 API pipelines: food, label, barcode' } },
        { week: 11, task: { en: 'GitHub Actions CI/CD, CSV token optimization (~60% savings), cache crawling pipeline', vi: 'GitHub Actions CI/CD, tối ưu token CSV (~60%), pipeline crawling cache' } },
        { week: 12, task: { en: 'Private ECS + VPC Endpoints (no NAT), S3 cache sync, final presentation', vi: 'Private ECS + VPC Endpoints (không NAT), S3 cache sync, thuyết trình cuối' } },
    ];

    return (
        <AnimatedPage>
            <div className="page-container">
                <Breadcrumb items={[{ label: 'Worklog' }]} />

                <SectionHeader icon="worklog" title="WORKLOG" />

                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-100 shadow-sm mb-12">
                        <p className="text-text-secondary mb-6 text-lg leading-relaxed">
                        {language === 'en'
                            ? 'A 12-week internship at AWS Vietnam (05/01/2026 – 05/04/2026) as AI + DevOps + Backend Engineer for Team NeuraX. Built NutriTrack — an AI-powered nutrition tracking API with 3 core pipelines, private ECS infrastructure, and automated CI/CD.'
                            : 'Thực tập 12 tuần tại AWS Vietnam (05/01/2026 – 05/04/2026) vai trò AI + DevOps + Backend Engineer cho Team NeuraX. Xây dựng NutriTrack — API theo dõi dinh dưỡng bằng AI với 3 pipelines chính, hạ tầng ECS private, và CI/CD tự động.'}
                    </p>

                    <p className="text-text-secondary text-lg leading-relaxed">
                        {language === 'en'
                            ? 'Click any week below to view detailed tasks, achievements, and technical notes for that period:'
                            : 'Nhấn vào tuần bên dưới để xem chi tiết công việc, thành tựu và ghi chú kỹ thuật của từng giai đoạn:'}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {weeks.map((item) => (
                        <Link
                            key={item.week}
                            to={`/worklog/week-${item.week}`}
                            className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                        >
                            {/* Decorative Background Icon */}
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                                </svg>
                            </div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="week-badge">
                                        {item.week}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-accent-orange group-hover:bg-accent-orange group-hover:text-white transition-colors duration-300">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14" />
                                            <path d="m12 5 7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-accent-orange transition-colors">
                                    {language === 'en' ? `Week ${item.week}` : `Tuần ${item.week}`}
                                </h3>

                                <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                                    {item.task[language]}
                                </p>

                                <div className="mt-auto pt-4 flex items-center text-sm font-medium text-accent-orange opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                    {language === 'en' ? 'View Details' : 'Xem Chi Tiết'}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </AnimatedPage>
    );
}

// Individual week page - loads from Markdown
export function WeekWorklogPage({ weekNumber }: { weekNumber: number }) {
    const { language } = useLanguage();

    // Load markdown content for this week
    const content = loadContent(`worklog/week-${weekNumber}`, language);

    return (
        <AnimatedPage>
            <div className="page-container">
                <Breadcrumb
                    items={[
                        { label: 'Worklog', path: '/worklog' },
                        { label: `${language === 'en' ? 'Week' : 'Tuần'} ${weekNumber}` },
                    ]}
                />

                <SectionHeader
                    icon="worklog"
                    title={language === 'en' ? `WEEK ${weekNumber} WORKLOG` : `NHẬT KÝ TUẦN ${weekNumber}`}
                />

                <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <MarkdownRenderer content={content} />
                </div>
            </div>
        </AnimatedPage>
    );
}

// Export individual week pages
export function Week1Page() { return <WeekWorklogPage weekNumber={1} />; }
export function Week2Page() { return <WeekWorklogPage weekNumber={2} />; }
export function Week3Page() { return <WeekWorklogPage weekNumber={3} />; }
export function Week4Page() { return <WeekWorklogPage weekNumber={4} />; }
export function Week5Page() { return <WeekWorklogPage weekNumber={5} />; }
export function Week6Page() { return <WeekWorklogPage weekNumber={6} />; }
export function Week7Page() { return <WeekWorklogPage weekNumber={7} />; }
export function Week8Page() { return <WeekWorklogPage weekNumber={8} />; }
export function Week9Page() { return <WeekWorklogPage weekNumber={9} />; }
export function Week10Page() { return <WeekWorklogPage weekNumber={10} />; }
export function Week11Page() { return <WeekWorklogPage weekNumber={11} />; }
export function Week12Page() { return <WeekWorklogPage weekNumber={12} />; }
