import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { LanguageProvider } from './contexts/LanguageContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import {
    WorklogPage,
    Week1Page, Week2Page, Week3Page, Week4Page, Week5Page, Week6Page,
    Week7Page, Week8Page, Week9Page, Week10Page, Week11Page, Week12Page,
} from './pages/WorklogPage';
import { ProposalPage } from './pages/ProposalPage';
import { EventsPage } from './pages/EventsPage';
import {
    WorkshopPage,
    WorkshopSectionPage,
} from './pages/WorkshopPages';
import { EvaluationPage } from './pages/EvaluationPage';
import { FeedbackPage } from './pages/FeedbackPage';

function AppContent() {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [location.pathname]);

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<HomePage />} />

                {/* Worklog Routes */}
                <Route path="/worklog" element={<WorklogPage />} />
                <Route path="/worklog/week-1" element={<Week1Page />} />
                <Route path="/worklog/week-2" element={<Week2Page />} />
                <Route path="/worklog/week-3" element={<Week3Page />} />
                <Route path="/worklog/week-4" element={<Week4Page />} />
                <Route path="/worklog/week-5" element={<Week5Page />} />
                <Route path="/worklog/week-6" element={<Week6Page />} />
                <Route path="/worklog/week-7" element={<Week7Page />} />
                <Route path="/worklog/week-8" element={<Week8Page />} />
                <Route path="/worklog/week-9" element={<Week9Page />} />
                <Route path="/worklog/week-10" element={<Week10Page />} />
                <Route path="/worklog/week-11" element={<Week11Page />} />
                <Route path="/worklog/week-12" element={<Week12Page />} />

                {/* Other sections */}
                <Route path="/proposal" element={<ProposalPage />} />
                <Route path="/events" element={<EventsPage />} />

                {/* Workshop Routes - dynamic routing up to 3 levels */}
                <Route path="/workshop" element={<WorkshopPage />} />
                {/* Level 3: /workshop/:sectionId/:subId/:subSubId */}
                <Route path="/workshop/:sectionId/:subId/:subSubId" element={<WorkshopSectionPage />} />
                {/* Level 2: /workshop/:sectionId/:subId */}
                <Route path="/workshop/:sectionId/:subId" element={<WorkshopSectionPage />} />
                {/* Level 1: /workshop/:sectionId */}
                <Route path="/workshop/:sectionId" element={<WorkshopSectionPage />} />

                {/* Evaluation & Feedback */}
                <Route path="/evaluation" element={<EvaluationPage />} />
                <Route path="/feedback" element={<FeedbackPage />} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    return (
        <HashRouter>
            <LanguageProvider>
                <Layout>
                    <AppContent />
                </Layout>
            </LanguageProvider>
        </HashRouter>
    );
}

export default App;
