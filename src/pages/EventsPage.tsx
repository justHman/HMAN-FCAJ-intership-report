import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useLanguage } from '../contexts/LanguageContext';
import { Calendar, MapPin, User } from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import { SectionHeader } from '../components/SectionHeader';
import { loadEvents } from '../utils/eventLoader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function EventsPage() {
    const { language } = useLanguage();

    // Load events from Markdown files
    const events = loadEvents(language);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return language === 'en' ? 'Invalid Date' : 'Ngày không hợp lệ';

        try {
            // Try to parse the date string
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                // If parsing fails, return the original string
                return dateStr;
            }
            return date.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <AnimatedPage>
            <div className="page-container">
                <Breadcrumb
                    items={[{ label: language === 'en' ? 'Events Participated' : 'Sự Kiện Tham Gia' }]}
                />

                <SectionHeader icon="events" title={language === 'en' ? 'EVENTS PARTICIPATED' : 'SỰ KIỆN THAM GIA'} />

                <div className="space-y-8 mt-6">
                    {events.map((event, index) => (
                        <div key={event.id} className="card-static">
                            <h2 className="section-title">
                                {language === 'en' ? `Event ${index + 1}: ` : `Sự kiện ${index + 1}: `}
                                {event.title}
                            </h2>

                            {/* Event Details Table */}
                            <div className="overflow-x-auto mb-6">
                                <table className="content-table">
                                    <tbody>
                                        <tr>
                                            <td className="font-medium w-32 bg-gray-50">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={16} className="text-accent-orange" />
                                                    {language === 'en' ? 'Date & Time' : 'Ngày & Giờ'}
                                                </div>
                                            </td>
                                            <td>{formatDate(event.date)}</td>
                                        </tr>
                                        <tr>
                                            <td className="font-medium bg-gray-50">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={16} className="text-accent-orange" />
                                                    {language === 'en' ? 'Location' : 'Địa điểm'}
                                                </div>
                                            </td>
                                            <td>{event.location || (language === 'en' ? 'N/A' : 'Không có')}</td>
                                        </tr>
                                        <tr>
                                            <td className="font-medium bg-gray-50">
                                                <div className="flex items-center gap-2">
                                                    <User size={16} className="text-accent-orange" />
                                                    {language === 'en' ? 'Role' : 'Vai trò'}
                                                </div>
                                            </td>
                                            <td>{event.role || (language === 'en' ? 'Attendee' : 'Người tham dự')}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Event Description */}
                            {event.description && (
                                <div className="mb-4">
                                    <h3 className="font-semibold text-text-primary mb-2">
                                        {language === 'en' ? 'Event Description' : 'Mô tả sự kiện'}
                                    </h3>
                                    <div className="text-text-secondary prose prose-sm max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.description}</ReactMarkdown>
                                    </div>
                                </div>
                            )}

                            {/* Main Activities */}
                            {event.activities && (
                                <div className="mb-4">
                                    <h3 className="font-semibold text-text-primary mb-2">
                                        {language === 'en' ? 'Main Activities' : 'Các hoạt động chính'}
                                    </h3>
                                    <div className="text-text-secondary prose prose-sm max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.activities}</ReactMarkdown>
                                    </div>
                                </div>
                            )}

                            {/* Outcomes / Value Gained */}
                            {event.outcomes && event.outcomes.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-text-primary mb-2">
                                        {language === 'en' ? 'Outcomes / Value Gained' : 'Kết quả / Giá trị thu được'}
                                    </h3>
                                    <ul className="list-disc list-inside space-y-1 text-text-secondary">
                                        {event.outcomes.map((item, i) => (
                                            <li key={i}>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{ p: ({ children }) => <>{children}</> }}
                                                >
                                                    {item}
                                                </ReactMarkdown>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </AnimatedPage>
    );
}
