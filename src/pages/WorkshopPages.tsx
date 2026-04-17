import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useLanguage } from '../contexts/LanguageContext';
import { Link, useParams } from 'react-router-dom';
import { AnimatedPage } from '../components/AnimatedPage';
import { SectionHeader } from '../components/SectionHeader';
import { loadWorkshopSection, loadWorkshopIndex } from '../utils/contentLoader';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { ChevronRight } from 'lucide-react';

// ─── Workshop Section Tree ────────────────────────────────────────────────────

interface WorkshopSection {
    id: string;
    folderName: string;
    en: string;
    vi: string;
    children?: WorkshopSection[];
}

const WORKSHOP_SECTIONS: WorkshopSection[] = [
    {
        id: '4.1-Overview',
        folderName: '4.1-Overview',
        en: '4.1 Overview',
        vi: '4.1 Tổng Quan',
    },
    {
        id: '4.2-Prerequiste',
        folderName: '4.2-Prerequiste',
        en: '4.2 Prerequisites',
        vi: '4.2 Điều Kiện Tiên Quyết',
    },
    {
        id: '4.3-Frontend',
        folderName: '4.3-Frontend',
        en: '4.3 Frontend Setup',
        vi: '4.3 Thiết Lập Frontend',
    },
    {
        id: '4.4-Backend',
        folderName: '4.4-Backend',
        en: '4.4 Backend Setup',
        vi: '4.4 Thiết Lập Backend',
        children: [
            { id: '4.4.1-Auth', folderName: '4.4-Backend/4.4.1-Auth', en: '4.4.1 Authentication', vi: '4.4.1 Xác Thực' },
            { id: '4.4.2-Data', folderName: '4.4-Backend/4.4.2-Data', en: '4.4.2 Data Layer', vi: '4.4.2 Lớp Dữ Liệu' },
            { id: '4.4.3-Storage', folderName: '4.4-Backend/4.4.3-Storage', en: '4.4.3 Storage Layer', vi: '4.4.3 Lớp Lưu Trữ' },
            {
                id: '4.4.4-Functions',
                folderName: '4.4-Backend/4.4.4-Functions',
                en: '4.4.4 Lambda Functions',
                vi: '4.4.4 Các Hàm Lambda',
                children: [
                    { id: '4.4.4.1-AIEngine', folderName: '4.4-Backend/4.4.4-Functions/4.4.4.1-AIEngine', en: '4.4.4.1 ai-engine (Bedrock)', vi: '4.4.4.1 ai-engine (Bedrock)' },
                    { id: '4.4.4.2-ScanImage', folderName: '4.4-Backend/4.4.4-Functions/4.4.4.2-ScanImage', en: '4.4.4.2 scan-image', vi: '4.4.4.2 scan-image' },
                    { id: '4.4.4.3-ProcessNutrition', folderName: '4.4-Backend/4.4.4-Functions/4.4.4.3-ProcessNutrition', en: '4.4.4.3 process-nutrition', vi: '4.4.4.3 process-nutrition' },
                    { id: '4.4.4.4-FriendRequest', folderName: '4.4-Backend/4.4.4-Functions/4.4.4.4-FriendRequest', en: '4.4.4.4 friend-request', vi: '4.4.4.4 friend-request' },
                    { id: '4.4.4.5-ResizeImage', folderName: '4.4-Backend/4.4.4-Functions/4.4.4.5-ResizeImage', en: '4.4.4.5 resize-image', vi: '4.4.4.5 resize-image' },
                ],
            },
        ],
    },
    {
        id: '4.5-ECS-Fargate',
        folderName: '4.5-ECS-Fargate',
        en: '4.5 ECS Fargate',
        vi: '4.5 ECS Fargate',
        children: [
            { id: '4.5.1-VPC-Network', folderName: '4.5-ECS-Fargate/4.5.1-VPC-Network', en: '4.5.1 VPC & Network', vi: '4.5.1 VPC & Mạng' },
            { id: '4.5.2-Infrastructure', folderName: '4.5-ECS-Fargate/4.5.2-Infrastructure', en: '4.5.2 Infrastructure', vi: '4.5.2 Hạ Tầng Hỗ Trợ' },
            { id: '4.5.3-NAT-Instance', folderName: '4.5-ECS-Fargate/4.5.3-NAT-Instance', en: '4.5.3 NAT Optimization', vi: '4.5.3 Tối Ưu NAT' },
            { id: '4.5.4-Fargate-ALB', folderName: '4.5-ECS-Fargate/4.5.4-Fargate-ALB', en: '4.5.4 Fargate & ALB', vi: '4.5.4 Fargate & ALB' },
        ],
    },
    {
        id: '4.6-CICD',
        folderName: '4.6-CICD',
        en: '4.6 CI/CD',
        vi: '4.6 CI/CD',
    },
    {
        id: '4.7-Cleanup',
        folderName: '4.7-Cleanup',
        en: '4.7 Cleanup',
        vi: '4.7 Dọn Dẹp',
    },
];

// ─── Flat map for quick lookup by route id ────────────────────────────────────
function flattenSections(sections: WorkshopSection[]): Map<string, WorkshopSection> {
    const map = new Map<string, WorkshopSection>();
    for (const s of sections) {
        map.set(s.id, s);
        if (s.children) {
            for (const c of s.children) {
                map.set(c.id, c);
                map.set(`${s.id}/${c.id}`, c);
                if (c.children) {
                    for (const gc of c.children) {
                        map.set(gc.id, gc);
                        map.set(`${c.id}/${gc.id}`, gc);
                        map.set(`${s.id}/${c.id}/${gc.id}`, gc);
                    }
                }
            }
        }
    }
    return map;
}
const SECTION_MAP = flattenSections(WORKSHOP_SECTIONS);

// ─── Workshop Main Page ───────────────────────────────────────────────────────

export function WorkshopPage() {
    const { language } = useLanguage();
    const content = loadWorkshopIndex(language);

    return (
        <AnimatedPage>
            <div className="page-container">
                <Breadcrumb items={[{ label: 'Workshop' }]} />
                <SectionHeader icon="workshop" title={language === 'en' ? 'Technical Workshop' : 'Workshop Kỹ Thuật'} />

                <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 shadow-sm mt-6">
                    <MarkdownRenderer content={content} />
                </div>
            </div>
        </AnimatedPage>
    );
}

// ─── Workshop Section Page (dynamic) ─────────────────────────────────────────

export function WorkshopSectionPage() {
    const { language } = useLanguage();
    const params = useParams<{ sectionId: string; subId?: string; subSubId?: string }>();

    // Build compound key from URL params (support up to 3 levels)
    const routeId = params.subSubId
        ? `${params.sectionId}/${params.subId}/${params.subSubId}`
        : params.subId
        ? `${params.sectionId}/${params.subId}`
        : params.sectionId ?? '';

    const sectionMeta = SECTION_MAP.get(routeId);
    const folderName = sectionMeta?.folderName ?? routeId;

    const content = loadWorkshopSection(folderName, language);

    // Breadcrumb
    const parentId = params.subId ? params.sectionId : undefined;
    const parentMeta = parentId ? SECTION_MAP.get(parentId) : undefined;
    const grandParentId = params.subSubId ? params.sectionId : undefined;
    const grandParentMeta = grandParentId ? SECTION_MAP.get(grandParentId) : undefined;
    const midParentId = params.subSubId && params.subId ? `${params.sectionId}/${params.subId}` : undefined;
    const midParentMeta = midParentId ? SECTION_MAP.get(midParentId) : undefined;

    const crumbs = [
        { label: 'Workshop', path: '/workshop' },
        ...(grandParentMeta ? [{ label: language === 'en' ? grandParentMeta.en : grandParentMeta.vi, path: `/workshop/${grandParentId}` }] : []),
        ...(midParentMeta ? [{ label: language === 'en' ? midParentMeta.en : midParentMeta.vi, path: `/workshop/${params.sectionId}/${params.subId}` }] : []),
        ...(parentMeta && !params.subSubId ? [{ label: language === 'en' ? parentMeta.en : parentMeta.vi, path: `/workshop/${parentId}` }] : []),
        { label: sectionMeta ? (language === 'en' ? sectionMeta.en : sectionMeta.vi) : routeId },
    ];

    return (
        <AnimatedPage>
            <div className="page-container">
                <Breadcrumb items={crumbs} />
                <SectionHeader icon="workshop" title={sectionMeta ? (language === 'en' ? sectionMeta.en : sectionMeta.vi) : routeId} />

                <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 shadow-sm mt-6">
                    <MarkdownRenderer content={content} sectionPath={folderName} />
                </div>

                {/* Child section links if this section has children */}
                {sectionMeta?.children && sectionMeta.children.length > 0 && (
                    <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 shadow-sm mt-6">
                        <h3 className="section-title mb-4">{language === 'en' ? 'Sub-sections' : 'Các Mục Con'}</h3>
                        <ul className="space-y-3">
                            {sectionMeta.children.map((child, i) => (
                                <li key={child.id}>
                                    <Link
                                        to={params.subId
                                            ? `/workshop/${params.sectionId}/${params.subId}/${child.id}`
                                            : `/workshop/${sectionMeta.id}/${child.id}`}
                                        className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-accent-orange/30 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-accent-orange font-mono text-sm font-semibold group-hover:bg-accent-orange group-hover:text-white transition-colors">
                                            {i + 1}
                                        </div>
                                        <span className="font-medium text-gray-700 group-hover:text-accent-orange transition-colors">
                                            {language === 'en' ? child.en : child.vi}
                                        </span>
                                        <ChevronRight size={18} className="ml-auto text-gray-400 group-hover:text-accent-orange transition-colors" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </AnimatedPage>
    );
}

// ─── Legacy exports (kept for backward compatibility) ─────────────────────────
export { WorkshopPage as WorkshopOverviewPage };
export { WorkshopSectionPage as WorkshopSetupPage };
export { WorkshopSectionPage as WorkshopImplementationPage };
export { WorkshopSectionPage as WorkshopCleanupPage };
