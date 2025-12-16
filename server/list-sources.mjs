import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourcesTsvPath = path.resolve(__dirname, '../shared/ai-sources.tsv');

function parseTsvRow(line) {
    const parts = line.split('\t');
    return {
        name: (parts[0] || '').trim(),
        main_url: (parts[1] || '').trim(),
        rss_url: (parts[2] || '').trim()
    };
}

function classifySourceType(source) {
    const main = (source.main_url || '').toLowerCase();
    const rss = (source.rss_url || '').toLowerCase();

    if (main.includes('youtube.com')) {
        if (main.includes('playlist?list=')) return 'youtube_playlist';
        return 'youtube_channel';
    }
    if (main.includes('reddit.com')) return 'community_reddit';
    if (main.includes('huggingface.co/models')) return 'research_platform_api';
    if (
        main.includes('arxiv.org') ||
        main.includes('paperswithcode.com') ||
        main.includes('jmlr.org') ||
        main.includes('mlr.press') ||
        main.includes('distill.pub')
    ) {
        return 'research_platform';
    }
    if (main.includes('substack.com') || rss.includes('beehiiv.com') || main.includes('beehiiv.com'))
        return 'newsletter';
    if (
        rss.includes('/podcast') ||
        main.includes('/podcast') ||
        main.includes('ai-podcast') ||
        rss.includes('feeds.blubrry.com') ||
        rss.includes('changelog.com')
    )
        return 'podcast';
    if (
        main.includes('openai.com') ||
        main.includes('deepmind.com') ||
        main.includes('ai.meta.com') ||
        main.includes('huggingface.co/blog') ||
        main.includes('blogs.microsoft.com') ||
        main.includes('aws.amazon.com/blogs') ||
        main.includes('developer.nvidia.com') ||
        main.includes('research.ibm.com')
    ) {
        return 'company_blog';
    }
    return 'rss_website';
}

function loadSources() {
    const tsv = fs.readFileSync(sourcesTsvPath, 'utf-8');
    const lines = tsv.split(/\r?\n/).filter(Boolean);
    const [, ...rows] = lines;
    return rows.map(parseTsvRow).filter((s) => s.name && s.main_url);
}

const sources = loadSources();
const counts = new Map();
let missingRss = 0;

for (const source of sources) {
    const type = classifySourceType(source);
    counts.set(type, (counts.get(type) || 0) + 1);
    if (!source.rss_url && type !== 'youtube_channel' && type !== 'youtube_playlist' && type !== 'research_platform_api') {
        missingRss += 1;
    }
}

console.log(`Registered sources in ${sourcesTsvPath}: ${sources.length}`);
for (const [type, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`- ${type}: ${count}`);
}
console.log(`Missing RSS URL (non-YouTube/API): ${missingRss}`);

