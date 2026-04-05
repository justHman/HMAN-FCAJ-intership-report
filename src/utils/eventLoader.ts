
export interface EventData {
    id: string;
    title: string;
    date: string;
    location: string;
    role: string;
    description: string;
    activities: string;
    outcomes: string[];
}

// Eagerly load all event markdown files
const eventModules = import.meta.glob('/content/events/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export function loadEvents(language: 'en' | 'vi'): EventData[] {
    const events: EventData[] = [];

    // Filter files for the requested language
    const relevantPaths = Object.keys(eventModules).filter((path) =>
        path.endsWith(`.${language}.md`)
    );

    // Sort by filename to ensure order (01, 02, 03...)
    relevantPaths.sort();

    for (const path of relevantPaths) {
        const rawContent = eventModules[path] as string;
        const event = parseEventMarkdown(rawContent);
        // Use filename as ID (e.g., "01-aws-community-day")
        const id = path.split('/').pop()?.replace(`.${language}.md`, '') || 'unknown';

        events.push({ ...event, id });
    }

    return events;
}

function parseEventMarkdown(content: string): Omit<EventData, 'id'> {
    const lines = content.split('\n');
    let title = '';
    let date = '';
    let location = '';
    let role = '';
    let descriptionLines: string[] = [];
    let activitiesLines: string[] = [];
    let outcomes: string[] = [];

    let section: 'meta' | 'description' | 'activities' | 'outcomes' = 'meta';
    let titleFound = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineLower = line.toLowerCase();

        // Parse title from H1 header ONLY (first one)
        if (!titleFound && line.startsWith('# ')) {
            title = line.substring(2).trim();
            titleFound = true;
            continue;
        }

        // Detect section changes BEFORE parsing content
        // Check for H2 headers that indicate sections
        if (line.startsWith('## ')) {
            const headerText = line.substring(3).toLowerCase();

            if (headerText.includes('description') || headerText.includes('mô tả')) {
                section = 'description';
                continue;
            }
            if (headerText.includes('activities') || headerText.includes('hoạt động') || headerText.includes('main activities')) {
                section = 'activities';
                continue;
            }
            if (headerText.includes('outcome') || headerText.includes('kết quả') ||
                headerText.includes('takeaway') || headerText.includes('value')) {
                section = 'outcomes';
                continue;
            }
            // Skip unknown H2 headers
            continue;
        }

        // Parse metadata fields
        if (lineLower.includes('**date') || lineLower.includes('**ngày')) {
            date = extractBoldValue(line);
            continue;
        }

        if (lineLower.includes('**location') || lineLower.includes('**địa điểm')) {
            location = extractBoldValue(line);
            continue;
        }

        if (lineLower.includes('**role') || lineLower.includes('**vai trò')) {
            role = extractBoldValue(line);
            continue;
        }

        // Skip empty lines and headers in content sections
        if (line === '' || line.startsWith('#')) {
            continue;
        }

        // Processing based on current section
        if (section === 'outcomes') {
            if (line.startsWith('- ') || line.startsWith('* ') || line.match(/^\d+\.\s/)) {
                const item = line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
                if (item) outcomes.push(item);
            }
        } else if (section === 'activities') {
            activitiesLines.push(line);
        } else if (section === 'description') {
            descriptionLines.push(line);
        }
    }

    return {
        title,
        date,
        location,
        role,
        description: descriptionLines.join('\n\n'),
        activities: activitiesLines.join('\n\n'),
        outcomes
    };
}

// Helper to extract value from bold format: **Field:** Value
function extractBoldValue(line: string): string {
    const match = line.match(/\*\*[^*]+\*\*:?\s*(.+)/);
    if (match) {
        return match[1].trim();
    }
    return '';
}
