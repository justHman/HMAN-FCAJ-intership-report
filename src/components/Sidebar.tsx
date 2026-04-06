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
            { id: 'ws-overview', path: '/workshop/4.1-Workshop-overview', label: { en: '4.1 Overview', vi: '4.1 Tổng Quan' }, icon: ChevronRight },
            { id: 'ws-prereq', path: '/workshop/4.2-Prerequiste', label: { en: '4.2 Prerequisites', vi: '4.2 Điều Kiện' }, icon: ChevronRight },
            {
                id: 'ws-foundation', path: '/workshop/4.3-Foundation-Setup', label: { en: '4.3 Foundation Setup', vi: '4.3 Thiết Lập Nền Tảng' }, icon: ChevronRight,
                children: [
                    { id: 'ws-4.3.1', path: '/workshop/4.3-Foundation-Setup/4.3.1-Amplify-Init', label: { en: '4.3.1 Amplify Init', vi: '4.3.1 Amplify Init' }, icon: ChevronRight },
                    { id: 'ws-4.3.2', path: '/workshop/4.3-Foundation-Setup/4.3.2-Cognito-Auth', label: { en: '4.3.2 Cognito Auth', vi: '4.3.2 Cognito Auth' }, icon: ChevronRight },
                    { id: 'ws-4.3.3', path: '/workshop/4.3-Foundation-Setup/4.3.3-S3-Storage', label: { en: '4.3.3 S3 Storage', vi: '4.3.3 S3 Storage' }, icon: ChevronRight },
                ],
            },
            {
                id: 'ws-monitoring', path: '/workshop/4.4-Monitoring-Setup', label: { en: '4.4 Data Layer', vi: '4.4 Tầng Dữ Liệu' }, icon: ChevronRight,
                children: [
                    { id: 'ws-4.4.1', path: '/workshop/4.4-Monitoring-Setup/4.4.1-AppSync', label: { en: '4.4.1 AppSync', vi: '4.4.1 AppSync' }, icon: ChevronRight },
                    { id: 'ws-4.4.2', path: '/workshop/4.4-Monitoring-Setup/4.4.2-DynamoDB', label: { en: '4.4.2 DynamoDB', vi: '4.4.2 DynamoDB' }, icon: ChevronRight },
                ],
            },
            {
                id: 'ws-processing', path: '/workshop/4.5-Processing-Setup', label: { en: '4.5 Lambda & AI', vi: '4.5 Lambda & AI' }, icon: ChevronRight,
                children: [
                    { id: 'ws-4.5.1', path: '/workshop/4.5-Processing-Setup/4.5.1-Bedrock', label: { en: '4.5.1 Bedrock', vi: '4.5.1 Bedrock' }, icon: ChevronRight },
                    { id: 'ws-4.5.2', path: '/workshop/4.5-Processing-Setup/4.5.2-AIEngine', label: { en: '4.5.2 AI Engine', vi: '4.5.2 AI Engine' }, icon: ChevronRight },
                ],
            },
            {
                id: 'ws-automation', path: '/workshop/4.6-Automation-Setup', label: { en: '4.6 API & Social', vi: '4.6 API & Xã Hội' }, icon: ChevronRight,
                children: [
                    { id: 'ws-4.6.1', path: '/workshop/4.6-Automation-Setup/4.6.1-FriendRequest', label: { en: '4.6.1 FriendRequest', vi: '4.6.1 FriendRequest' }, icon: ChevronRight },
                    { id: 'ws-4.6.2', path: '/workshop/4.6-Automation-Setup/4.6.2-Realtime-Subscriptions', label: { en: '4.6.2 Realtime Subscriptions', vi: '4.6.2 Realtime Subscriptions' }, icon: ChevronRight },
                ],
            },
            {
                id: 'ws-dashboard', path: '/workshop/4.7-Dashboard-Setup', label: { en: '4.7 Frontend', vi: '4.7 Frontend' }, icon: ChevronRight,
                children: [
                    { id: 'ws-4.7.1', path: '/workshop/4.7-Dashboard-Setup/4.7.1-ReactNative', label: { en: '4.7.1 React Native', vi: '4.7.1 React Native' }, icon: ChevronRight },
                    { id: 'ws-4.7.2', path: '/workshop/4.7-Dashboard-Setup/4.7.2-UIComponents', label: { en: '4.7.2 UI Components', vi: '4.7.2 UI Components' }, icon: ChevronRight },
                ],
            },
            { id: 'ws-verify', path: '/workshop/4.8-Verify-Setup', label: { en: '4.8 ECS Deployment', vi: '4.8 Triển Khai ECS' }, icon: ChevronRight },
            { id: 'ws-cdk', path: '/workshop/4.9-Use-CDK', label: { en: '4.9 CI/CD', vi: '4.9 CI/CD' }, icon: ChevronRight },
            { id: 'ws-cleanup', path: '/workshop/4.10-Cleanup', label: { en: '4.10 Cleanup', vi: '4.10 Dọn Dẹp' }, icon: ChevronRight },
            { id: 'ws-appendices', path: '/workshop/4.11-Appendices', label: { en: '4.11 Appendices', vi: '4.11 Phụ Lục' }, icon: ChevronRight },
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
    { label: 'Workshop', path: '/workshop', keywords: ['lab', 'hands-on', 'tutorial'] },
    { label: 'Workshop Overview', path: '/workshop/overview', keywords: ['introduction', 'vpc', 's3', 'endpoints'] },
    { label: 'Workshop Setup', path: '/workshop/setup', keywords: ['prerequisites', 'configuration'] },
    { label: 'Workshop Implementation', path: '/workshop/implementation', keywords: ['steps', 'deploy', 'code'] },
    { label: 'Workshop Clean Up', path: '/workshop/cleanup', keywords: ['delete', 'resources', 'cost'] },
    { label: 'Self-Evaluation', path: '/evaluation', keywords: ['assessment', 'criteria', 'rating', 'good', 'fair'] },
    { label: 'Sharing & Feedback', path: '/feedback', keywords: ['feelings', 'satisfaction', 'recommend', 'knowledge'] },
];

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
            items.forEach((item) => {
                // Determine if this item or any of its children are active
                const isActiveOrChildActive = currentPath === item.path || currentPath.startsWith(item.path + '/');

                if (isActiveOrChildActive && item.children) {
                    setExpanded((prev) => {
                        if (!prev.includes(item.id)) return [...prev, item.id];
                        return prev;
                    });
                }

                if (item.children) {
                    expandPath(item.children, currentPath);
                }
            });
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
        setExpanded((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
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
                            ${depth === 0 ? 'px-4' : depth === 1 ? 'pl-10 pr-4' : depth === 2 ? 'pl-[4.5rem] pr-4' : 'pl-[5.5rem] pr-4'}
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
