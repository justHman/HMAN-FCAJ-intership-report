import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Sidebar, navigation } from './Sidebar';
import { useLanguage } from '../contexts/LanguageContext';

interface LayoutProps {
    children: ReactNode;
}

type NavItemType = typeof navigation[0];

// Recursively flatten navigation for prev/next buttons
function flattenNav(items: NavItemType[]): { path: string; label: { en: string; vi: string } }[] {
    const result: { path: string; label: { en: string; vi: string } }[] = [];
    
    function traverse(navItems: NavItemType[]) {
        navItems.forEach((item) => {
            result.push({ path: item.path, label: item.label });
            if (item.children) {
                traverse(item.children);
            }
        });
    }
    
    traverse(items);
    return result;
}

export function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const { t } = useLanguage();

    const flatNav = flattenNav(navigation);
    const currentIndex = flatNav.findIndex((item) => item.path === location.pathname);
    const prevPage = currentIndex > 0 ? flatNav[currentIndex - 1] : null;
    const nextPage = currentIndex < flatNav.length - 1 ? flatNav[currentIndex + 1] : null;

    return (
        <div className="min-h-screen">
            <Sidebar />

            <main className="main-content">
                {children}

                {/* Bottom Navigation */}
                <div className="page-container border-t border-gray-200 mt-8 pt-6">
                    <div className="flex justify-between items-center">
                        {prevPage ? (
                            <Link
                                to={prevPage.path}
                                className="flex items-center gap-2 text-accent-orange hover:underline"
                            >
                                <ChevronLeft size={18} />
                                <span className="text-sm">{t(prevPage.label)}</span>
                            </Link>
                        ) : (
                            <div />
                        )}

                        {nextPage && (
                            <Link
                                to={nextPage.path}
                                className="flex items-center gap-2 text-accent-orange hover:underline"
                            >
                                <span className="text-sm">{t(nextPage.label)}</span>
                                <ChevronRight size={18} />
                            </Link>
                        )}
                    </div>
                </div>
            </main>

            {/* Side Navigation Arrows */}
            {prevPage && (
                <Link to={prevPage.path} className="nav-arrow-left hidden lg:flex">
                    <ChevronLeft size={32} />
                </Link>
            )}
            {nextPage && (
                <Link to={nextPage.path} className="nav-arrow-right hidden lg:flex">
                    <ChevronRight size={32} />
                </Link>
            )}
        </div>
    );
}
