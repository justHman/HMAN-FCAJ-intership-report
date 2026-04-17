import { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    ChevronDown,
    ChevronRight,
    Menu,
    X,
    Globe,
    Facebook,
    Search,
    Home,
    BookOpen,
    FileText,
    Calendar,
    Wrench,
    CheckCircle,
    MessageSquare,
    Check,
    RotateCcw,
    LucideIcon
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface NavItem {
    id: string;
    path: string;
    label: { en: string; vi: string };
    icon: LucideIcon;
    children?: NavItem[];
}

interface SearchResult {
    label: string;
    path: string;
    context?: string;
}

const VISITED_PAGES_KEY = 'internship-report-visited-pages';

const navigation: NavItem[] = [
    { id: 'home', path: '/', label: { en: 'Internship Report', vi: 'Báo Cáo Thực Tập' }, icon: Home },
    {
        id: 'worklog',
        path: '/worklog',
        label: { en: '1. Worklog', vi: '1. Nhật Ký' },
        icon: BookOpen,
        children: [
            { id: 'week1', path: '/worklog/week-1', label: { en: '1.1 Week 1', vi: '1.1 Tuần 1' }, icon: ChevronRight },
            { id: 'week2', path: '/worklog/week-2', label: { en: '1.2 Week 2', vi: '1.2 Tuần 2' }, icon: ChevronRight },
            { id: 'week3', path: '/worklog/week-3', label: { en: '1.3 Week 3', vi: '1.3 Tuần 3' }, icon: ChevronRight },
            { id: 'week4', path: '/worklog/week-4', label: { en: '1.4 Week 4', vi: '1.4 Tuần 4' }, icon: ChevronRight },
            { id: 'week5', path: '/worklog/week-5', label: { en: '1.5 Week 5', vi: '1.5 Tuần 5' }, icon: ChevronRight },
            { id: 'week6', path: '/worklog/week-6', label: { en: '1.6 Week 6', vi: '1.6 Tuần 6' }, icon: ChevronRight },
            { id: 'week7', path: '/worklog/week-7', label: { en: '1.7 Week 7', vi: '1.7 Tuần 7' }, icon: ChevronRight },
            { id: 'week8', path: '/worklog/week-8', label: { en: '1.8 Week 8', vi: '1.8 Tuần 8' }, icon: ChevronRight },
            { id: 'week9', path: '/worklog/week-9', label: { en: '1.9 Week 9', vi: '1.9 Tuần 9' }, icon: ChevronRight },
            { id: 'week10', path: '/worklog/week-10', label: { en: '1.10 Week 10', vi: '1.10 Tuần 10' }, icon: ChevronRight },
            { id: 'week11', path: '/worklog/week-11', label: { en: '1.11 Week 11', vi: '1.11 Tuần 11' }, icon: ChevronRight },
            { id: 'week12', path: '/worklog/week-12', label: { en: '1.12 Week 12', vi: '1.12 Tuần 12' }, icon: ChevronRight },
        ],
    },
    { id: 'proposal', path: '/proposal', label: { en: '2. Proposal', vi: '2. Đề Xuất' }, icon: FileText },
    { id: 'events', path: '/events', label: { en: '3. Events Participated', vi: '3. Sự Kiện Tham Gia' }, icon: Calendar },
    {
        id: 'workshop',
        path: '/workshop',
        label: { en: '4. Workshop', vi: '4. Workshop' },
        icon: Wrench,
        children: [
            { id: 'ws-overview', path: '/workshop/4.1-Overview', label: { en: '4.1 Overview', vi: '4.1 Tổng Quan' }, icon: ChevronRight },
            { id: 'ws-prereq', path: '/workshop/4.2-Prerequiste', label: { en: '4.2 Prerequisites', vi: '4.2 Điều Kiện' }, icon: ChevronRight },
            { id: 'ws-frontend', path: '/workshop/4.3-Frontend', label: { en: '4.3 Frontend Setup', vi: '4.3 Thiết Lập Frontend' }, icon: ChevronRight },
            {
                id: 'ws-backend', path: '/workshop/4.4-Backend', label: { en: '4.4 Backend Setup', vi: '4.4 Thiết Lập Backend' }, icon: ChevronRight,
                children: [
                    { id: 'ws-4.4.1', path: '/workshop/4.4-Backend/4.4.1-Auth', label: { en: '4.4.1 Authentication', vi: '4.4.1 Xác Thực' }, icon: ChevronRight },
                    { id: 'ws-4.4.2', path: '/workshop/4.4-Backend/4.4.2-Data', label: { en: '4.4.2 Data Layer', vi: '4.4.2 Lớp Dữ Liệu' }, icon: ChevronRight },
                    { id: 'ws-4.4.3', path: '/workshop/4.4-Backend/4.4.3-Storage', label: { en: '4.4.3 Storage Layer', vi: '4.4.3 Lớp Lưu Trữ' }, icon: ChevronRight },
                    {
                        id: 'ws-4.4.4', path: '/workshop/4.4-Backend/4.4.4-Functions', label: { en: '4.4.4 Lambda Functions', vi: '4.4.4 Hàm Lambda' }, icon: ChevronRight,
                        children: [
                            { id: 'ws-4.4.4.1', path: '/workshop/4.4-Backend/4.4.4-Functions/4.4.4.1-AIEngine', label: { en: '4.4.4.1 ai-engine', vi: '4.4.4.1 ai-engine' }, icon: ChevronRight },
                            { id: 'ws-4.4.4.2', path: '/workshop/4.4-Backend/4.4.4-Functions/4.4.4.2-ScanImage', label: { en: '4.4.4.2 scan-image', vi: '4.4.4.2 scan-image' }, icon: ChevronRight },
                            { id: 'ws-4.4.4.3', path: '/workshop/4.4-Backend/4.4.4-Functions/4.4.4.3-ProcessNutrition', label: { en: '4.4.4.3 process-nutrition', vi: '4.4.4.3 process-nutrition' }, icon: ChevronRight },
                            { id: 'ws-4.4.4.4', path: '/workshop/4.4-Backend/4.4.4-Functions/4.4.4.4-FriendRequest', label: { en: '4.4.4.4 friend-request', vi: '4.4.4.4 friend-request' }, icon: ChevronRight },
                            { id: 'ws-4.4.4.5', path: '/workshop/4.4-Backend/4.4.4-Functions/4.4.4.5-ResizeImage', label: { en: '4.4.4.5 resize-image', vi: '4.4.4.5 resize-image' }, icon: ChevronRight },
                        ]
                    },
                ]
            },
            {
                id: 'ws-ecs', path: '/workshop/4.5-ECS-Fargate', label: { en: '4.5 ECS Fargate', vi: '4.5 ECS Fargate' }, icon: ChevronRight,
                children: [
                    { id: 'ws-4.5.1', path: '/workshop/4.5-ECS-Fargate/4.5.1-VPC-Network', label: { en: '4.5.1 VPC & Network', vi: '4.5.1 VPC & Mạng' }, icon: ChevronRight },
                    { id: 'ws-4.5.2', path: '/workshop/4.5-ECS-Fargate/4.5.2-Infrastructure', label: { en: '4.5.2 Infrastructure', vi: '4.5.2 Hạ Tầng' }, icon: ChevronRight },
                    { id: 'ws-4.5.3', path: '/workshop/4.5-ECS-Fargate/4.5.3-NAT-Instance', label: { en: '4.5.3 NAT Optimization', vi: '4.5.3 Tối Ưu NAT' }, icon: ChevronRight },
                    { id: 'ws-4.5.4', path: '/workshop/4.5-ECS-Fargate/4.5.4-Fargate-ALB', label: { en: '4.5.4 Fargate & ALB', vi: '4.5.4 Fargate & ALB' }, icon: ChevronRight },
                ]
            },
            { id: 'ws-cicd', path: '/workshop/4.6-CICD', label: { en: '4.6 CI/CD', vi: '4.6 CI/CD' }, icon: ChevronRight },
            { id: 'ws-cleanup', path: '/workshop/4.7-Cleanup', label: { en: '4.7 Cleanup', vi: '4.7 Dọn Dẹp' }, icon: ChevronRight },
        ],
    },
    { id: 'evaluation', path: '/evaluation', label: { en: '5. Self-Evaluation', vi: '5. Tự Đánh Giá' }, icon: CheckCircle },
    { id: 'feedback', path: '/feedback', label: { en: '6. Sharing & Feedback', vi: '6. Chia Sẻ & Phản Hồi' }, icon: MessageSquare },
];

// Searchable content - includes all navigation items and some page content keywords
const searchableContent = [
    // Navigation items
    { label: 'Internship Report', path: '/', keywords: ['home', 'student', 'information'] },
    { label: 'Worklog', path: '/worklog', keywords: ['weekly', 'tasks', 'log'] },
    { label: 'Week 1 Worklog', path: '/worklog/week-1', keywords: ['week 1', 'objectives', 'achievements', 'aws', 'iam'] },
    { label: 'Week 2 Worklog', path: '/worklog/week-2', keywords: ['week 2', 'ec2', 's3'] },
    { label: 'Week 3 Worklog', path: '/worklog/week-3', keywords: ['week 3'] },
    { label: 'Week 4 Worklog', path: '/worklog/week-4', keywords: ['week 4'] },
    { label: 'Week 5 Worklog', path: '/worklog/week-5', keywords: ['week 5'] },
    { label: 'Week 6 Worklog', path: '/worklog/week-6', keywords: ['week 6'] },
    { label: 'Week 7 Worklog', path: '/worklog/week-7', keywords: ['week 7'] },
    { label: 'Week 8 Worklog', path: '/worklog/week-8', keywords: ['week 8'] },
    { label: 'Week 9 Worklog', path: '/worklog/week-9', keywords: ['week 9'] },
    { label: 'Week 10 Worklog', path: '/worklog/week-10', keywords: ['week 10'] },
    { label: 'Week 11 Worklog', path: '/worklog/week-11', keywords: ['week 11'] },
    { label: 'Week 12 Worklog', path: '/worklog/week-12', keywords: ['week 12'] },
    { label: 'Proposal', path: '/proposal', keywords: ['project', 'solution', 'architecture', 'aws services', 'timeline', 'budget'] },
    { label: 'Events Participated', path: '/events', keywords: ['event', 'community', 'meetup', 'aws day'] },
    { label: 'Workshop', path: '/workshop', keywords: ['lab', 'hands-on', 'tutorial', 'nutritrack'] },
    { label: '4.1 Overview', path: '/workshop/4.1-Overview', keywords: ['overview', 'architecture', 'nutritrack', 'introduction', 'dynamodb', 'lambda'] },
    { label: '4.2 Prerequisites', path: '/workshop/4.2-Prerequiste', keywords: ['prerequisites', 'node 22', 'aws cli', 'bedrock access', 'qwen3', 'docker', 'expo'] },
    { label: '4.3 Frontend Setup', path: '/workshop/4.3-Frontend', keywords: ['frontend', 'expo', 'react native', 'clone', 'npm install', 'qr code'] },
    { label: '4.4 Backend Setup', path: '/workshop/4.4-Backend', keywords: ['amplify gen 2', 'backend', 'sandbox', 'pipeline-deploy'] },
    { label: '4.4.1 Authentication', path: '/workshop/4.4-Backend/4.4.1-Auth', keywords: ['cognito', 'google oauth', 'email', 'secret manager', 'amplify auth'] },
    { label: '4.4.2 Data Layer', path: '/workshop/4.4-Backend/4.4.2-Data', keywords: ['appsync', 'dynamodb', 'graphql', 'schema', 'food log', 'fridge item', 'friendship'] },
    { label: '4.4.3 Storage Layer', path: '/workshop/4.4-Backend/4.4.3-Storage', keywords: ['s3', 'storage', 'amplify', 'bucket', 'incoming', 'media'] },
    { label: '4.4.4 Lambda Functions', path: '/workshop/4.4-Backend/4.4.4-Functions', keywords: ['lambda', 'functions', 'amplify functions'] },
    { label: '4.4.4.1 ai-engine (Bedrock)', path: '/workshop/4.4-Backend/4.4.4-Functions/4.4.4.1-AIEngine', keywords: ['aiengine', 'bedrock', 'qwen', 'ollie', 'coach', 'voice', 'transcribe', 'photo analysis'] },
    { label: '4.4.4.2 scan-image', path: '/workshop/4.4-Backend/4.4.4-Functions/4.4.4.2-ScanImage', keywords: ['scan image', 'ecs proxy', 'jwt', 'analyze food', 'barcode'] },
    { label: '4.4.4.3 process-nutrition', path: '/workshop/4.4-Backend/4.4.4-Functions/4.4.4.3-ProcessNutrition', keywords: ['process nutrition', 'fuzzy match', 'food db', 'hybrid lookup'] },
    { label: '4.4.4.4 friend-request', path: '/workshop/4.4-Backend/4.4.4-Functions/4.4.4.4-FriendRequest', keywords: ['friend request', 'social', 'friendship', 'transactwrite'] },
    { label: '4.4.4.5 resize-image', path: '/workshop/4.4-Backend/4.4.4-Functions/4.4.4.5-ResizeImage', keywords: ['resize', 'sharp', 's3 trigger', 'image optimization'] },
    { label: '4.5 ECS Fargate', path: '/workshop/4.5-ECS-Fargate', keywords: ['ecs', 'fargate', 'vpc', 'alb', 'nat instance', 'docker', 'container'] },
    { label: '4.5.1 VPC & Network', path: '/workshop/4.5-ECS-Fargate/4.5.1-VPC-Network', keywords: ['vpc', 'subnets', 'security groups', 'internet gateway'] },
    { label: '4.5.2 Infrastructure', path: '/workshop/4.5-ECS-Fargate/4.5.2-Infrastructure', keywords: ['s3 bucket', 'secrets manager', 'iam roles', 'ecs task role'] },
    { label: '4.5.3 NAT Optimization', path: '/workshop/4.5-ECS-Fargate/4.5.3-NAT-Instance', keywords: ['nat instance', 'iptables', 'masquerade', 't4g.nano', 'ip forwarding'] },
    { label: '4.5.4 Fargate & ALB', path: '/workshop/4.5-ECS-Fargate/4.5.4-Fargate-ALB', keywords: ['fargate', 'alb', 'autoscaling', 'task definition', 'jwt', 'ecr'] },
    { label: '4.6 CI/CD', path: '/workshop/4.6-CICD', keywords: ['cicd', 'github actions', 'amplify hosting', 'pipeline', 'ecr push'] },
    { label: '4.7 Cleanup', path: '/workshop/4.7-Cleanup', keywords: ['cleanup', 'delete', 'teardown', 'amplify destroy'] },
    { label: 'Self-Evaluation', path: '/evaluation', keywords: ['assessment', 'criteria', 'rating', 'good', 'fair'] },
    { label: 'Sharing & Feedback', path: '/feedback', keywords: ['feelings', 'satisfaction', 'recommend', 'knowledge'] },
];

const getAllDescendantIds = (item: NavItem): string[] => {
    let ids: string[] = [];
    if (item.children) {
        item.children.forEach(child => {
            ids.push(child.id);
            ids = ids.concat(getAllDescendantIds(child));
        });
    }
    return ids;
};

const findNavItem = (items: NavItem[], id: string): NavItem | undefined => {
    for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
            const found = findNavItem(item.children, id);
            if (found) return found;
        }
    }
    return undefined;
};

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [expanded, setExpanded] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [visitedPages, setVisitedPages] = useState<string[]>(() => {
        try {
            const saved = sessionStorage.getItem(VISITED_PAGES_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const { language, setLanguage, t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    // Mark current page as visited
    const markAsVisited = useCallback((path: string) => {
        setVisitedPages((prev) => {
            if (prev.includes(path)) return prev;
            const updated = [...prev, path];
            sessionStorage.setItem(VISITED_PAGES_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Mark current page as visited when location changes
    useEffect(() => {
        markAsVisited(location.pathname);
    }, [location.pathname, markAsVisited]);

    // Auto-expand parent when item or child is active
    useEffect(() => {
        const expandPath = (items: NavItem[], currentPath: string) => {
            let idsToAdd: string[] = [];
            
            items.forEach((item) => {
                // Determine if this item or any of its children are active
                const isActiveOrChildActive = currentPath === item.path || currentPath.startsWith(item.path + '/');

                if (isActiveOrChildActive && item.children) {
                    idsToAdd.push(item.id);
                    // If workshop is active, automatically expand ALL its sub-sections deeply
                    if (item.id === 'workshop' || currentPath.startsWith('/workshop/')) {
                        idsToAdd = idsToAdd.concat(getAllDescendantIds(item));
                    }
                }

                if (item.children) {
                    expandPath(item.children, currentPath);
                }
            });
            
            if (idsToAdd.length > 0) {
                setExpanded((prev) => {
                    const newExpanded = new Set(prev);
                    let changed = false;
                    idsToAdd.forEach(id => {
                        if (!newExpanded.has(id)) {
                            newExpanded.add(id);
                            changed = true;
                        }
                    });
                    return changed ? Array.from(newExpanded) : prev;
                });
            }
        };

        expandPath(navigation, location.pathname);
    }, [location.pathname]);

    // Search functionality
    const searchResults = useMemo<SearchResult[]>(() => {
        if (!searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase();
        return searchableContent
            .filter((item) => {
                const labelMatch = item.label.toLowerCase().includes(query);
                const keywordMatch = item.keywords.some((k) => k.toLowerCase().includes(query));
                return labelMatch || keywordMatch;
            })
            .map((item) => ({
                label: item.label,
                path: item.path,
                context: item.keywords.find((k) => k.toLowerCase().includes(query)),
            }))
            .slice(0, 8); // Limit results
    }, [searchQuery]);

    const handleSearchClick = (path: string) => {
        navigate(path);
        setSearchQuery('');
        setShowSearchResults(false);
        setIsOpen(false);
    };

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        setExpanded((prev) => {
            if (prev.includes(id)) {
                // Collapse: remove this id and all its descendants deeply
                const item = findNavItem(navigation, id);
                const descendants = item ? getAllDescendantIds(item) : [];
                const toRemove = new Set([id, ...descendants]);
                return prev.filter(i => !toRemove.has(i));
            } else {
                // Expand: add this id and deeply expand all its descendants
                const item = findNavItem(navigation, id);
                const descendants = item ? getAllDescendantIds(item) : [];
                return [...prev, id, ...descendants];
            }
        });
    };

    const renderNavItem = (item: NavItem, depth = 0) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expanded.includes(item.id);
        const isActive = location.pathname === item.path || (hasChildren && location.pathname.startsWith(item.path + '/'));
        const isVisited = visitedPages.includes(item.path);
        const Icon = item.icon;

        return (
            <div key={item.id} className="mb-px">
                <div className="relative">
                    <NavLink
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`
                            group flex items-center justify-between py-3 transition-all duration-200
                            ${depth === 0 ? 'px-4' : depth === 1 ? 'pl-10 pr-4' : 'pl-[3.5rem] pr-4'}
                            ${isActive
                                ? 'bg-gradient-to-r from-accent-orange/10 to-transparent text-white border-l-[3px] border-accent-orange'
                                : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'
                            }
                        `}
                    >
                        <div className="flex items-center gap-3.5">
                            {depth === 0 ? (
                                <Icon
                                    size={20}
                                    strokeWidth={1.5}
                                    className={`transition-colors duration-200 ${isActive ? 'text-accent-orange' : 'text-gray-500 group-hover:text-gray-300'}`}
                                />
                            ) : hasChildren ? (
                                <div
                                    role="button"
                                    onClick={(e) => toggleExpand(item.id, e)}
                                    className={`transition-colors duration-200 p-0.5 rounded hover:bg-white/10 ${isActive ? 'text-accent-orange' : 'text-gray-500'}`}
                                >
                                    {isExpanded ? <ChevronDown size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />}
                                </div>
                            ) : (
                                <div className="w-[18px] flex items-center justify-center">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-accent-orange' : 'bg-gray-600 group-hover:bg-gray-400'} transition-colors duration-200`}></div>
                                </div>
                            )}

                            <span className={`text-sm tracking-wide ${depth === 0 ? 'font-medium' : 'font-normal'}`}>
                                {t(item.label)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Visited checkmark - shown for all visited pages */}
                            {isVisited && (
                                <Check
                                    size={16}
                                    strokeWidth={2.5}
                                    className="text-accent-orange"
                                />
                            )}

                            {/* Right side expand toggle ONLY for top level parent */}
                            {depth === 0 && hasChildren && (
                                <div
                                    role="button"
                                    onClick={(e) => toggleExpand(item.id, e)}
                                    className="p-1 rounded hover:bg-white/10 text-gray-500 transition-colors"
                                >
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </div>
                            )}
                        </div>
                    </NavLink>
                </div>

                {hasChildren && isExpanded && (
                    <div className="bg-black/20">
                        {item.children!.map((child) => renderNavItem(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-aws-navy text-white rounded-lg shadow-lg"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar flex flex-col h-screen fixed left-0 top-0 z-40 w-72 bg-[#0f1b2d] border-r border-gray-800 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

                {/* Logo Area - Minimalist */}
                <div className="h-20 flex items-center justify-center border-b border-gray-800 bg-[#0f1b2d]">
                    <Link to="/" onClick={() => setIsOpen(false)} className="cursor-pointer">
                        <img src={`${import.meta.env.BASE_URL}FCJ-logo.png`} alt="FCJ" className="h-10 opacity-90 hover:opacity-100 transition-opacity" />
                    </Link>
                </div>

                {/* Search - Modern Pill/Floating feel */}
                <div className="p-5 pb-2">
                    <div className="relative group">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-accent-orange transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSearchResults(true);
                            }}
                            onFocus={() => setShowSearchResults(true)}
                            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                            placeholder={language === 'en' ? 'Search...' : 'Tìm kiếm...'}
                            className="w-full pl-10 pr-4 py-2.5 bg-black/20 text-white text-sm rounded-full border border-gray-700/50 focus:border-accent-orange/50 focus:bg-black/30 focus:outline-none transition-all placeholder:text-gray-600"
                        />

                        {/* Search Results Dropdown */}
                        {showSearchResults && searchResults.length > 0 && (
                            <div className="absolute left-0 right-0 mt-2 bg-[#1a2639] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                                {searchResults.map((result, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSearchClick(result.path)}
                                        className="w-full px-4 py-3 text-left hover:bg-white/5 border-b border-gray-700/50 last:border-0"
                                    >
                                        <div className="text-sm text-accent-orange font-medium flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-accent-orange"></span>
                                            {result.label}
                                        </div>
                                        {result.context && (
                                            <div className="text-xs text-gray-500 mt-0.5 ml-3">{result.context}</div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                    {navigation.map((item) => renderNavItem(item))}
                </nav>

                {/* Footer / More */}
                <div className="border-t border-gray-800 bg-[#0d1625]">
                    <div className="p-4 space-y-3">
                        {/* AWS Study Group */}
                        <a
                            href="https://www.facebook.com/groups/awsstudygroupfcj/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <Facebook size={18} className="text-[#1877F2]" />
                            <span>AWS Study Group</span>
                        </a>

                        {/* Language Toggle */}
                        <button
                            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
                            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <Globe size={18} className="text-accent-orange" />
                                <span>{language === 'en' ? 'English' : 'Tiếng Việt'}</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-gray-600 border border-gray-700 px-1.5 py-px rounded">
                                {language === 'en' ? 'EN' : 'VI'}
                            </span>
                        </button>

                        {/* Reset Progress Button */}
                        {visitedPages.length > 0 && (
                            <button
                                onClick={() => {
                                    setVisitedPages([]);
                                    sessionStorage.removeItem(VISITED_PAGES_KEY);
                                }}
                                className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={18} className="text-gray-500 group-hover:text-accent-orange transition-colors" />
                                    <span>{language === 'en' ? 'Reset Progress' : 'Đặt Lại Tiến Trình'}</span>
                                </div>
                                <span className="text-[10px] font-medium text-gray-600 bg-gray-800/50 px-1.5 py-px rounded">
                                    {visitedPages.length}
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Meta Info */}
                    <div className="px-7 pb-5 pt-1">
                        <div className="text-[10px] font-medium text-gray-600 flex justify-between tracking-wide">
                            <span>LAST UPDATED</span>
                            <span className="text-gray-500">{__BUILD_DATE__}</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

export { navigation };
