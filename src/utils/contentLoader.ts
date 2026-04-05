// Content loader utility for loading Markdown files
// Flat files: /content/path.en.md or /content/path.vi.md
// Subfolder (workshop): /content/workshop/section/index.en.md or index.vi.md

const contentModules = import.meta.glob('/content/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export function loadContent(path: string, language: 'en' | 'vi'): string {
    // Try language-specific file first
    const langPath = `/content/${path}.${language}.md`;
    const fallbackPath = `/content/${path}.en.md`;

    if (contentModules[langPath]) {
        return contentModules[langPath] as string;
    }

    // Fallback to English if translation not available
    if (contentModules[fallbackPath]) {
        return contentModules[fallbackPath] as string;
    }

    // Return placeholder if file not found
    return `# Content Not Found\n\nThe content for **${path}** is not available yet. Please create the file at \`content/${path}.${language}.md\`.`;
}

/**
 * Load workshop section content from subfolder index files.
 * e.g. loadWorkshopSection('5.1-Workshop-overview', 'en')
 *   → /content/workshop/5.1-Workshop-overview/index.en.md
 */
export function loadWorkshopSection(section: string, language: 'en' | 'vi'): string {
    const langPath = `/content/workshop/${section}/index.${language}.md`;
    const fallbackPath = `/content/workshop/${section}/index.en.md`;

    if (contentModules[langPath]) {
        return contentModules[langPath] as string;
    }
    if (contentModules[fallbackPath]) {
        return contentModules[fallbackPath] as string;
    }

    return `# ${section}\n\nContent not found for this section.`;
}

/**
 * Load workshop root index.
 */
export function loadWorkshopIndex(language: 'en' | 'vi'): string {
    const langPath = `/content/workshop/index.${language}.md`;
    const fallbackPath = `/content/workshop/index.en.md`;
    return (contentModules[langPath] ?? contentModules[fallbackPath] ?? '# Workshop\n\nContent not available.') as string;
}

// Helper to list all available content files
export function listContentFiles(): string[] {
    return Object.keys(contentModules).map(path =>
        path.replace('/content/', '').replace(/\.(en|vi)\.md$/, '')
    ).filter((value, index, self) => self.indexOf(value) === index);
}
