import dotenv from 'dotenv';
dotenv.config(); // MUST be before any imports that use process.env

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import he from 'he';
import { load as loadHtml } from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateWithOpenRouter } from './lib/openrouter.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readJsonRelative = (relativePath) => {
    const filePath = path.resolve(__dirname, relativePath);
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContents);
};

const categoriesConfig = readJsonRelative('../shared/article-categories.json');
const sourcesTsvPath = path.resolve(__dirname, '../shared/ai-sources.tsv');

const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ADMIN_API_KEY',
    'API_ALLOWED_ORIGINS',
    'OPENROUTER_API_KEY'
];
const missingEnv = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnv.length) {
    const message = `Missing required environment variables: ${missingEnv.join(', ')}`;
    console.error(message);
    throw new Error(message);
}

const ARTICLE_CATEGORIES = categoriesConfig.articleCategories;
const CATEGORY_SET = new Set(ARTICLE_CATEGORIES);
const DEFAULT_CATEGORY = ARTICLE_CATEGORIES[0];

const ensureCategory = (category) => {
    if (!CATEGORY_SET.has(category)) {
        console.warn(`Unknown category "${category}" found in feed configuration. Falling back to ${DEFAULT_CATEGORY}.`);
        return DEFAULT_CATEGORY;
    }
    return category;
};

const app = express();
const parser = new Parser({
    customFields: {
        item: ['media:thumbnail', 'media:group', 'itunes:image']
    }
});
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const allowedOrigins = process.env.API_ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

if (!allowedOrigins.length) {
    throw new Error('API_ALLOWED_ORIGINS must contain at least one domain.');
}

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SOURCE_CATEGORY = 'AI';

function parseTsvRow(line) {
    // Supports tabs, but tolerates multiple spaces too.
    const parts = line.split('\t');
    if (parts.length >= 3) {
        return {
            name: (parts[0] || '').trim(),
            main_url: (parts[1] || '').trim(),
            rss_url: (parts[2] || '').trim()
        };
    }

    // Fallback: split on 2+ spaces.
    const alt = line.split(/\s{2,}/).map((p) => p.trim());
    return {
        name: (alt[0] || '').trim(),
        main_url: (alt[1] || '').trim(),
        rss_url: (alt[2] || '').trim()
    };
}

function loadAiSources() {
    const tsv = fs.readFileSync(sourcesTsvPath, 'utf-8');
    const lines = tsv
        .split(/\r?\n/)
        .map((l) => l.trimEnd())
        .filter(Boolean);

    const [header, ...rows] = lines;
    if (!header || !header.toLowerCase().includes('name')) {
        throw new Error(`Invalid TSV header in ${sourcesTsvPath}`);
    }

    const sources = rows
        .map(parseTsvRow)
        .filter((row) => row.name && row.main_url);

    const byName = new Map();
    for (const source of sources) {
        if (byName.has(source.name)) {
            console.warn(`Duplicate source name in TSV ignored: ${source.name}`);
            continue;
        }
        byName.set(source.name, source);
    }

    return [...byName.values()];
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
    if (main.includes('arxiv.org') || main.includes('paperswithcode.com') || main.includes('jmlr.org') || main.includes('mlr.press') || main.includes('distill.pub')) {
        return 'research_platform';
    }
    if (main.includes('substack.com') || rss.includes('beehiiv.com') || main.includes('beehiiv.com')) return 'newsletter';
    if (rss.includes('/podcast') || main.includes('/podcast') || main.includes('ai-podcast') || rss.includes('feeds.blubrry.com') || rss.includes('changelog.com')) return 'podcast';
    if (main.includes('openai.com') || main.includes('deepmind.com') || main.includes('ai.meta.com') || main.includes('huggingface.co/blog') || main.includes('blogs.microsoft.com') || main.includes('aws.amazon.com/blogs') || main.includes('developer.nvidia.com') || main.includes('research.ibm.com')) {
        return 'company_blog';
    }
    return 'rss_website';
}

function inferArticleCategory(sourceType, source) {
    const name = (source.name || '').toLowerCase();
    const main = (source.main_url || '').toLowerCase();

    if (sourceType === 'research_platform' || sourceType === 'research_platform_api') return 'Research';
    if (sourceType === 'community_reddit') {
        if (name.includes('datascience')) return 'Business';
        return 'Research';
    }
    if (sourceType === 'podcast') {
        if (name.includes('business') || main.includes('emerj.com')) return 'Business';
        return 'Technology';
    }
    if (name.includes('business') || name.includes('trends') || name.includes('analytics') || main.includes('forrester.com') || main.includes('marketingaiinstitute.com') || main.includes('oecd.ai') || main.includes('partnershiponai.org')) {
        return 'Business';
    }
    if (name.includes('stanford') || name.includes('bair') || name.includes('mila') || name.includes('ieee') || name.includes('mit') || name.includes('distill') || name.includes('jmlr') || name.includes('pmlr')) {
        return 'Research';
    }
    return 'Technology';
}

function isResearchSource(sourceType, category) {
    return sourceType === 'research_platform' || sourceType === 'research_platform_api' || category === 'Research';
}

function safeIdFromName(name) {
    return String(name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 80);
}

const YOUTUBE_CACHE_PATH = path.resolve(__dirname, '.cache', 'youtube-feeds.json');

function loadYoutubeCache() {
    try {
        const raw = fs.readFileSync(YOUTUBE_CACHE_PATH, 'utf-8');
        return JSON.parse(raw);
    } catch (error) {
        logErrorDetails('YouTube cache read failed', error);
        return {};
    }
}

function saveYoutubeCache(cache) {
    const dir = path.dirname(YOUTUBE_CACHE_PATH);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(YOUTUBE_CACHE_PATH, JSON.stringify(cache, null, 2));
}

function youtubeRssFromChannelId(channelId) {
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}

function youtubeRssFromPlaylistId(playlistId) {
    return `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
}

async function resolveYoutubeRssUrl(mainUrl) {
    const url = String(mainUrl || '');
    if (!url) return null;

    const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (playlistMatch) {
        return youtubeRssFromPlaylistId(playlistMatch[1]);
    }

    const channelMatch = url.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/);
    if (channelMatch) {
        return youtubeRssFromChannelId(channelMatch[1]);
    }

    // Fetch HTML and extract channelId.
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (compatible; NewsFetcher/1.0; +https://example.com)'
            }
        });
        const html = await res.text();
        const metaMatch = html.match(/itemprop=\"channelId\" content=\"(UC[a-zA-Z0-9_-]+)\"/);
        if (metaMatch) return youtubeRssFromChannelId(metaMatch[1]);
        const jsonMatch = html.match(/\"channelId\"\s*:\s*\"(UC[a-zA-Z0-9_-]+)\"/);
        if (jsonMatch) return youtubeRssFromChannelId(jsonMatch[1]);
    } catch (err) {
        logErrorDetails(`YouTube resolve failed for ${url}`, err);
    }

    return null;
}

const resolveRequestIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length) {
        return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length) {
        return forwarded[0];
    }
    return req.ip || req.connection?.remoteAddress || 'unknown';
};

const createIpRateLimiter = ({ windowMs, max, errorMessage }) => {
    const buckets = new Map();
    return (req, res, next) => {
        const ip = resolveRequestIp(req);
        const now = Date.now();
        const bucket = buckets.get(ip) || { count: 0, start: now };

        if (now - bucket.start >= windowMs) {
            bucket.count = 0;
            bucket.start = now;
        }

        bucket.count += 1;
        buckets.set(ip, bucket);

        if (bucket.count > max) {
            return res.status(429).json({
                success: false,
                error: errorMessage || 'Rate limit exceeded. Try again later.'
            });
        }

        return next();
    };
};

const adminRateLimit = createIpRateLimiter({
    windowMs: 60 * 1000,
    max: 5,
    errorMessage: 'Rate limit exceeded. Try again later.'
});

const newsletterRateLimit = createIpRateLimiter({
    windowMs: 5 * 60 * 1000,
    max: 3,
    errorMessage: 'Please wait before trying again.'
});

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const sanitizeSourceTag = (value = '') =>
    value
        .replace(/[\r\n]+/g, ' ')
        .replace(/[<>"'`]/g, '')
        .trim();
const getErrorMessage = (err) => (err instanceof Error ? err.message : String(err ?? 'Unknown error'));

const logErrorDetails = (context, err) => {
    const error = err ?? {};
    console.error(context, {
        message: error?.message ?? String(err ?? 'Unknown error'),
        status: error?.status,
        responseData: error?.response?.data
    });
};

const logSupabaseError = (context, data, error) => {
    console.error(context, {
        data,
        error
    });
};

const SUPABASE_PROJECT_REF = (() => {
    try {
        const url = new URL(process.env.VITE_SUPABASE_URL);
        const hostname = url.hostname || '';
        return hostname.split('.')[0] || null;
    } catch (error) {
        logErrorDetails('Failed to parse VITE_SUPABASE_URL for project ref', error);
        return null;
    }
})();

const requireAdminApiKey = (req, res, next) => {
    const providedKey = req.get('x-api-key');
    if (!providedKey || providedKey !== ADMIN_API_KEY) {
        console.warn(`Unauthorized access attempt blocked for route ${req.path} from IP ${resolveRequestIp(req)}`);
        return res.status(401).json({
            success: false,
            error: 'Unauthorized'
        });
    }
    return next();
};

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.warn(`Blocked CORS request from origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    }
};

app.use(cors(corsOptions));
app.use(express.json());

const AI_SOURCES = loadAiSources();

const buildDebugInfo = (metrics) => ({
    supabaseProjectRef: SUPABASE_PROJECT_REF,
    sourcesLoadedCount: AI_SOURCES.length,
    categoriesLoadedCount: ARTICLE_CATEGORIES.length,
    openrouterEnabled: Boolean(process.env.OPENROUTER_API_KEY),
    articlesFetchedCount: metrics.articlesFetchedCount,
    articlesSummarizedCount: metrics.articlesSummarizedCount,
    upsertedCount: metrics.upsertedCount
});

const getMaxSourcesPerRun = (selfTest) => {
    if (selfTest) return 2;
    return Number.parseInt(process.env.MAX_SOURCES_PER_RUN || '30', 10);
};

async function buildFeedList() {
    const youtubeCache = loadYoutubeCache();
    let cacheDirty = false;

    const feeds = [];

    for (const source of AI_SOURCES) {
        const type = classifySourceType(source);
        const articleCategory = ensureCategory(inferArticleCategory(type, source));
        const isResearch = isResearchSource(type, articleCategory);
        const id = safeIdFromName(source.name);

        let feedUrl = source.rss_url || null;
        if ((type === 'youtube_channel' || type === 'youtube_playlist') && !feedUrl) {
            const cached = youtubeCache[source.main_url];
            if (typeof cached === 'string' && cached.startsWith('http')) {
                feedUrl = cached;
            } else {
                const resolved = await resolveYoutubeRssUrl(source.main_url);
                if (resolved) {
                    feedUrl = resolved;
                    youtubeCache[source.main_url] = resolved;
                    cacheDirty = true;
                } else {
                    console.warn(`Unable to resolve YouTube RSS for ${source.name} (${source.main_url})`);
                }
            }
        }

        feeds.push({
            id,
            name: source.name,
            type,
            main_url: source.main_url,
            url: feedUrl,
            category: articleCategory,
            source_category: SOURCE_CATEGORY,
            is_research: isResearch
        });
    }

    if (cacheDirty) saveYoutubeCache(youtubeCache);

    return feeds;
}

const IMPORTANT_KEYWORDS = [
    // Major Companies
    'openai',
    'google',
    'microsoft',
    'meta',
    'anthropic',
    'deepmind',
    'nvidia',
    // Major Products
    'gpt',
    'chatgpt',
    'gemini',
    'claude',
    'copilot',
    'bard',
    // Important Events
    'breakthrough',
    'launch',
    'release',
    'announces',
    'unveils',
    'acquisition',
    // Research Terms
    'research',
    'model',
    'algorithm',
    'neural network',
    'machine learning',
    // Impact Terms
    'regulation',
    'policy',
    'lawsuit',
    'controversy',
    'ethics',
    'safety',
    // Business Terms
    'funding',
    'investment',
    'billion',
    'million',
    'ipo',
    'partnership'
];

const PRESTIGIOUS_SOURCES = [
    'MIT Technology Review',
    'TechCrunch AI',
    'Reuters Technology',
    'VentureBeat AI'
];

function calculateImportanceScore(title, summary, source) {
    let score = 5;
    const text = `${title} ${summary}`.toLowerCase();

    const keywordMatches = IMPORTANT_KEYWORDS.filter((keyword) =>
        text.includes(keyword.toLowerCase())
    );
    score += Math.min(keywordMatches.length, 5);

    if (PRESTIGIOUS_SOURCES.includes(source)) {
        score += 2;
    }

    return score;
}

const CDATA_RE = /<!\[CDATA\[([\s\S]*?)\]\]>/gi;
const STRIP_RE = /<\s*(script|style|iframe|object|embed|noscript)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi;
const CONTROL_RE = /[\u0000-\u001F\u007F]+/g;
const MULTI_WS_RE = /\s+/g;

const STOPWORDS = new Set([
    'the', 'and', 'for', 'are', 'with', 'that', 'this', 'from', 'have', 'has', 'will',
    'about', 'into', 'their', 'they', 'them', 'its', 'been', 'was', 'were', 'while',
    'where', 'when', 'your', 'our', 'you', 'but', 'can', 'just', 'than', 'also',
    'any', 'each', 'other', 'more', 'over', 'after', 'before', 'under', 'between',
    'which', 'would', 'should', 'could', 'how', 'who', 'what', 'why', 'because',
    'during', 'including', 'across', 'among', 'once', 'both', 'being', 'per', 'such',
    'very', 'via', 'every', 'still', 'many', 'much', 'new', 'latest'
]);

const CONTENT_FILTER_RULES = {
    minWordCount: 40,
    requiredAiSignals: [
        'ai',
        'artificial intelligence',
        'machine learning',
        'deep learning',
        'neural',
        'llm',
        'large language model',
        'generative',
        'transformer',
        'computer vision',
        'reinforcement learning',
        'diffusion',
        'robotics'
    ],
    bannedPatterns: [/sponsored/i, /giveaway/i, /advertorial/i],
    bannedTopics: [
        'war',
        'armed conflict',
        'gaza',
        'israel',
        'palestine',
        'ukraine',
        'russia',
        'iran',
        'north korea',
        'terror',
        'weapon',
        'missile'
    ]
};

const SUMMARY_CHAR_LIMIT = 800;

const stripCdata = (value) => value.replace(CDATA_RE, '$1');

export function sanitizeText(input) {
    if (input == null) return '';
    const raw = stripCdata(String(input));
    const withoutScripts = raw.replace(STRIP_RE, ' ');
    const $ = loadHtml(withoutScripts);
    $('script,style,iframe,object,embed,noscript').remove();
    const text = $('body').text() || $.root().text();
    return he.decode(text, { strict: false })
        .replace(CONTROL_RE, ' ')
        .replace(MULTI_WS_RE, ' ')
        .trim();
}

const FALLBACK_NEWS_IMAGES = [
    'https://source.unsplash.com/featured/?technology',
    'https://source.unsplash.com/featured/?ai',
    'https://source.unsplash.com/featured/?news',
    'https://source.unsplash.com/featured/?innovation'
];

const HF_API_TOKEN = process.env.HF_API_TOKEN;
const HF_IMAGE_MODEL =
    process.env.HF_IMAGE_MODEL || 'stabilityai/stable-diffusion-xl-base-1.0';
const HF_IMAGE_ENDPOINT =
    process.env.HF_IMAGE_ENDPOINT ||
    `https://router.huggingface.co/hf-inference/models/${HF_IMAGE_MODEL}`;
const HF_IMAGE_SIZE = process.env.HF_IMAGE_SIZE || '1024x576';
const HF_IMAGE_GUIDANCE = Number(process.env.HF_IMAGE_GUIDANCE || '7');
const HF_IMAGE_NEGATIVE_PROMPT =
    process.env.HF_IMAGE_NEGATIVE_PROMPT ||
    'text, watermark, logo, politics, war, violence, weapons, gore';
let hasLoggedMissingHfToken = false;
let hfAuthFailed = false;
const [HF_IMAGE_WIDTH, HF_IMAGE_HEIGHT] = (() => {
    const parts = HF_IMAGE_SIZE.toLowerCase().split('x');
    const width = parseInt(parts[0], 10);
    const height = parseInt(parts[1], 10);
    if (Number.isFinite(width) && Number.isFinite(height)) {
        return [width, height];
    }
    return [1024, 576];
})();

function selectFallbackImage(title = '', base = '') {
    const seed = `${title}${base}`;
    const normalizedLength = seed.trim().length || 1;
    return FALLBACK_NEWS_IMAGES[
        Math.abs(normalizedLength) % FALLBACK_NEWS_IMAGES.length
    ];
}

function isGeneratedFallback(url) {
    return (
        !url ||
        url.startsWith('https://source.unsplash.com/featured') ||
        FALLBACK_NEWS_IMAGES.includes(url)
    );
}

function absoluteUrl(url, base) {
    try {
        return new URL(url, base).href;
    } catch (error) {
        logErrorDetails('Failed to build absolute URL', error);
        return null;
    }
}

function extractHtmlImages(html, base) {
    if (!html) return [];
    const $ = loadHtml(html);

    const urls = [];

    // #1: OG / Twitter meta tags
    $("meta[property='og:image'], meta[name='og:image'], meta[property='twitter:image'], meta[name='twitter:image']")
        .each((_, el) => {
            const c = $(el).attr("content");
            if (c) urls.push(c);
        });

    // #2: <img> tags
    $("img").each((_, el) => {
        const c =
            $(el).attr("src") ||
            $(el).attr("data-src") ||
            $(el).attr("data-original") ||
            $(el).attr("data-lazy-src");
        if (c) urls.push(c);
    });

    // #3: JSON-LD (schema.org)
    $("script[type='application/ld+json']").each((_, el) => {
        try {
            const json = JSON.parse($(el).text());
            if (json.image) {
                if (Array.isArray(json.image)) urls.push(...json.image);
                else urls.push(json.image);
            }
        } catch (error) {
            logErrorDetails('Failed to parse JSON-LD image data', error);
        }
    });

    return urls
        .map((u) => absoluteUrl(u, base))
        .filter((u) => typeof u === "string" && u.startsWith("http"));
}

function extractMediaThumbnails(item) {
    const candidates = [];
    const group = item?.['media:group'];
    if (group) {
        const thumb = group['media:thumbnail'] || group.thumbnail;
        if (Array.isArray(thumb)) {
            for (const t of thumb) {
                if (t?.$?.url) candidates.push(t.$.url);
                if (t?.url) candidates.push(t.url);
            }
        } else if (thumb?.$?.url) {
            candidates.push(thumb.$.url);
        } else if (thumb?.url) {
            candidates.push(thumb.url);
        }
    }
    return candidates.filter(Boolean);
}

export function extractImageUrl(item = {}) {
    const base = item.link || "";

    const candidates = [];

    // enclosure tags
    if (item.enclosure?.url) candidates.push(absoluteUrl(item.enclosure.url, base));

    // media:content
    if (item["media:content"]?.url)
        candidates.push(absoluteUrl(item["media:content"].url, base));

    // media:thumbnail
    if (item["media:thumbnail"]?.url)
        candidates.push(absoluteUrl(item["media:thumbnail"].url, base));
    candidates.push(...extractMediaThumbnails(item).map((u) => absoluteUrl(u, base)));

    // HTML fields
    candidates.push(...extractHtmlImages(item.content, base));
    candidates.push(...extractHtmlImages(item.description, base));
    candidates.push(...extractHtmlImages(item.summary, base));

    const unique = [...new Set(candidates)].filter(
        (u) => typeof u === "string" && u.startsWith("http")
    );

    const valid = unique.filter((url) => {
        if (/\.(png|jpe?g|gif|webp|svg|avif)$/i.test(url)) return true;
        // Some CDNs (including Unsplash) omit extensions but include format hints.
        return /[?&](fm|format)=(jpg|jpeg|png|webp|avif)\b/i.test(url);
    });

    if (valid.length > 0) return valid[0];

    return null;
}

function buildImagePrompt({ title, summary, category, source }) {
    const cleanSummary = sanitizeText(summary || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 260);
    const cleanTitle = sanitizeText(title || '').replace(/["']/g, '');
    const focus = category
        ? `Focus on ${category.toLowerCase()} innovation.`
        : 'Focus on AI innovation.';
    const authority = source ? `As reported by ${source}.` : '';
    return `${cleanTitle}. ${cleanSummary} ${focus} ${authority} Shot as high-resolution editorial photography, natural lighting, expressive but realistic.`;
}

function bufferToDataUrl(buffer, mimeType = 'image/png') {
    if (!buffer) return null;
    return `data:${mimeType};base64,${Buffer.from(buffer).toString('base64')}`;
}

async function requestHuggingFaceImage(prompt) {
    if (!HF_API_TOKEN || !HF_IMAGE_MODEL) {
        if (!hasLoggedMissingHfToken) {
            console.warn(
                'HF_API_TOKEN or HF_IMAGE_MODEL is missing. Falling back to static images.'
            );
            hasLoggedMissingHfToken = true;
        }
        return null;
    }

    try {
        if (hfAuthFailed) return null;
        const response = await fetch(HF_IMAGE_ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${HF_API_TOKEN}`,
                'Content-Type': 'application/json',
                Accept: 'image/png'
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    negative_prompt: HF_IMAGE_NEGATIVE_PROMPT,
                    guidance_scale: HF_IMAGE_GUIDANCE,
                    width: HF_IMAGE_WIDTH,
                    height: HF_IMAGE_HEIGHT
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 401 || response.status === 403) {
                hfAuthFailed = true;
                console.warn(
                    `Hugging Face token rejected (${response.status}); disabling HF image generation for this run.`
                );
                return null;
            }
            console.warn(
                `Hugging Face image request failed (${response.status}): ${errorText}`
            );
            return null;
        }

        const contentType = response.headers.get('content-type') || '';
        const buffer = await response.arrayBuffer();

        // Some models return JSON with base64 data instead of raw image bytes.
        if (contentType.includes('application/json')) {
            const json = JSON.parse(Buffer.from(buffer).toString());
            const imageBase64 =
                json?.[0]?.b64_json ||
                json?.image_base64 ||
                json?.data?.[0]?.b64_json;
            if (imageBase64) {
                return `data:image/png;base64,${imageBase64}`;
            }
            return null;
        }

        return bufferToDataUrl(buffer, contentType || 'image/png');
    } catch (error) {
        logErrorDetails('Hugging Face image generation failed', error);
        return null;
    }
}

async function resolveArticleImage({ item, title, summary, category, source }) {
    const existing = extractImageUrl(item);
    if (existing) return existing;

    const prompt = buildImagePrompt({ title, summary, category, source });
    const generated = await requestHuggingFaceImage(prompt);
    if (generated) {
        return generated;
    }

    console.log(
        `No usable image found in RSS item for "${title}" (${source}).`
    );
    return null;
}

function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
}

function splitIntoSentences(text) {
    if (!text) return [];
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return [];
    return normalized
        .replace(/([.?!؟])\s+(?=[^\s])/g, '$1|')
        .split('|')
        .map((sentence) => sentence.trim())
        .filter(Boolean);
}

function buildFrequencyMap(text) {
    const freqMap = new Map();
    for (const token of tokenize(text)) {
        if (STOPWORDS.has(token)) continue;
        freqMap.set(token, (freqMap.get(token) || 0) + 1);
    }
    return freqMap;
}

function scoreSentence(sentence, freqMap) {
    const tokens = tokenize(sentence);
    if (!tokens.length) return 0;
    let score = 0;
    for (const token of tokens) {
        score += freqMap.get(token) || 0;
    }
    return score / tokens.length;
}

function selectTopSentences(sentences, freqMap, limit) {
    if (sentences.length <= limit) return sentences.slice();
    return sentences
        .map((sentence, index) => ({
            sentence,
            index,
            score: scoreSentence(sentence, freqMap)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .sort((a, b) => a.index - b.index)
        .map((entry) => entry.sentence);
}

function extractTopKeywords(freqMap, limit = 5) {
    return [...freqMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([keyword]) => keyword);
}

function buildNarrativeParagraph(title, source, keywords) {
    const focus =
        keywords.slice(0, 2).join(' & ') ||
        'momentum across core AI research and deployment';
    if (title && source) {
        return `${source} reports that "${title}" underscores ${focus}.`;
    }
    if (title) {
        return `"${title}" highlights ${focus}.`;
    }
    return `This update reflects ${focus}.`;
}

function clampText(text, limit = SUMMARY_CHAR_LIMIT) {
    if (!text) return '';
    if (text.length <= limit) return text;
    return `${text.slice(0, limit - 3).trim()}...`;
}

function formatEditorialSummary({ summarySentences, highlights, keywords, narrative }) {
    const blocks = [];
    if (summarySentences.length) {
        blocks.push(summarySentences.join(' '));
    }
    if (highlights.length) {
        blocks.push(`Key Points:\n- ${highlights.join('\n- ')}`);
    }
    if (keywords.length) {
        blocks.push(`Topics: ${keywords.join(', ')}`);
    }
    if (narrative) {
        blocks.push(`Why it matters: ${narrative}`);
    }
    return clampText(blocks.join('\n\n'));
}

// AI-powered summarization using OpenRouter (nvidia/nemotron-3-nano-30b-a3b:free)
// Retry with exponential backoff, no fallback to manual summarization
function buildFallbackEditorialPackage({ title, snippet, body }) {
    const fallbackSummary =
        [snippet, body]
            .map((value) => sanitizeText(value || ''))
            .find((value) => value && value.length > 0) || title || 'Summary unavailable';

    const summarySentences = fallbackSummary.split('.').filter(Boolean).slice(0, 2);
    const formattedSummary = formatEditorialSummary({
        summarySentences: summarySentences.length ? summarySentences : [fallbackSummary],
        highlights: [],
        keywords: [],
        narrative: ''
    });

    return {
        formattedSummary,
        keywords: [],
        highlights: [],
        headline: title
    };
}

async function generateAIEditorialPackage({ title, snippet, body, source, category }) {
    const combined = [snippet, body].filter(Boolean).join(' ').trim();
    if (!combined) {
        return {
            formattedSummary: sanitizeText(snippet || body || title || ''),
            content: sanitizeText(snippet || body || title || ''),
            keywords: [],
            highlights: [],
            headline: title
        };
    }

    const prompt = `Write a deep, authoritative technology report (500-700 words) based on the following AI news metadata.
      Style: Think Medium, Wired, or The Verge.
      Tone: Analytical, fluid, and narrative-driven.

      STRICT RULES:
      - NO BULLET POINTS. Use full paragraphs only.
      - DO NOT use phrases like "Key Points", "Highlights", "Key Takeaways", or "In summary".
      - Integrate all facts and data points naturally into the narrative body.
      - Use (##) for descriptive section headers (not "Highlights").

      Title: ${title}
      Source: ${source}
      Category: ${category || 'Technology'}
      Raw Insight: ${combined.slice(0, 3000)}

      Return ONLY a strict JSON object:
      {
        "short_summary": "A punchy 1-2 sentence lead for social sharing.",
        "headline": "A brilliant, clickable, yet professional headline.",
        "article_body": "A comprehensive long-form piece. Include a strong narrative opening, deep context, analytical body with (##) subheaders, and a final conclusive thought. MANDATORY: The final section MUST be titled '### Why it matters' and provides 2-3 paragraphs of deep strategic analysis.",
        "tags": ["AI", "Innovation", "Strategic Insights", "Future Tech"]
      }`;

    const systemPrompt = `You are a premier technology analyst for a publication like Medium or Wired. You never use lists or bullet points. You write in deep, fluid paragraphs that connect facts with strategic analysis. You are forbidden from using words like "Key Points" or "Highlights" - everything must be part of the main story flow. Return raw JSON only.`;

    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 1000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const aiResponse = await generateWithOpenRouter({
                prompt,
                systemPrompt,
                temperature: 0.5,
                maxTokens: 1500
            });

            // Parse the AI response
            let cleanResponse = aiResponse.trim();

            // Remove code fences if present
            if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```[a-zA-Z]*\s*/g, '').replace(/```$/g, '').trim();
            }

            const parsed = JSON.parse(cleanResponse);

            // Construct the full content with markdown
            let fullContent = parsed.article_body || '';

            // If the LLM didn't provide the body, fallback to constructing it
            if (!fullContent) {
                const narrative = `${source} reports on developments in ${category || 'AI technology'}.`;
                fullContent = (parsed.short_summary || '') + '\n\n' +
                    (parsed.highlights ? `## Key Highlights\n${parsed.highlights.map(h => `- ${h}`).join('\n')}` : '') + '\n\n' +
                    `### Why it matters\n${narrative}`;
            }

            return {
                formattedSummary: parsed.short_summary || parsed.summary || '',
                content: fullContent,
                keywords: parsed.tags || [],
                highlights: parsed.highlights || [],
                headline: parsed.headline || title
            };
        } catch (error) {
            const isLastAttempt = attempt === MAX_RETRIES;
            const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1);

            if (isLastAttempt) {
                logErrorDetails(
                    `AI summarization failed for "${title}" after ${MAX_RETRIES} attempts`,
                    error
                );
                return buildFallbackEditorialPackage({ title, snippet, body });
            } else {
                logErrorDetails(
                    `AI summarization attempt ${attempt}/${MAX_RETRIES} failed for "${title}", retrying in ${delayMs}ms`,
                    error
                );
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }

    return buildFallbackEditorialPackage({ title, snippet, body });
}

// Main editorial package function - uses AI only (no manual fallback)
async function createEditorialPackage({ title, snippet, body, source, category }) {
    return generateAIEditorialPackage({ title, snippet, body, source, category });
}

function applyContentFilters({ title, summary, body, source, minWordCount }) {
    const combined = [title, summary, body].filter(Boolean).join(' ').toLowerCase();
    const wordCount = combined.split(/\s+/).filter(Boolean).length;

    const effectiveMinWordCount =
        Number.isFinite(minWordCount) && minWordCount > 0
            ? minWordCount
            : CONTENT_FILTER_RULES.minWordCount;

    if (wordCount < effectiveMinWordCount) {
        return { allowed: false, reason: 'insufficient word count' };
    }

    if (
        !CONTENT_FILTER_RULES.requiredAiSignals.some((keyword) => combined.includes(keyword))
    ) {
        return { allowed: false, reason: 'missing AI keyword (no AI signal terms found)' };
    }

    const matchedPattern = CONTENT_FILTER_RULES.bannedPatterns.find((pattern) =>
        pattern.test(combined)
    );
    if (matchedPattern) {
        return { allowed: false, reason: `banned content pattern (${matchedPattern})` };
    }

    const escapeRegExp = (value) =>
        value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchesTopic = (text, topic) => {
        const normalized = String(topic || '').trim().toLowerCase();
        if (!normalized) return false;
        // Avoid substring false-positives (e.g. "war" inside "forward").
        const pattern = normalized
            .split(/\s+/)
            .map((part) => escapeRegExp(part))
            .join('\\s+');
        const re = new RegExp(`(?:^|\\W)${pattern}(?:\\W|$)`, 'i');
        return re.test(text);
    };

    const matchedTopic = CONTENT_FILTER_RULES.bannedTopics.find((topic) =>
        matchesTopic(combined, topic)
    );
    if (matchedTopic) {
        return { allowed: false, reason: `banned topic (${matchedTopic})` };
    }

    return { allowed: true };
}

function toIsoDate(item) {
    if (item.isoDate) return new Date(item.isoDate).toISOString();
    if (item.pubDate) return new Date(item.pubDate).toISOString();
    return new Date().toISOString();
}

async function buildArticleRecord(item, feed, metrics) {
    const title = sanitizeText(item.title) || 'No title';
    const sourceUrl = item.link || item.guid || null;
    if (!sourceUrl || sourceUrl === '#') {
        console.log(
            `Skipped item from ${feed.name} (${feed.type}): missing source URL for "${title}".`
        );
        return null;
    }
    const summarySource =
        item.contentSnippet || item.summary || item.content || '';
    const cleanSnippet = sanitizeText(summarySource) || 'No summary available';
    const articleBody = sanitizeText(
        item['content:encoded'] ||
        item.content ||
        item.summary ||
        item.description ||
        ''
    );

    const minWordCount = feed.type === 'podcast' || feed.type.startsWith('youtube') ? 10 : CONTENT_FILTER_RULES.minWordCount;
    const { allowed, reason } = applyContentFilters({
        title,
        summary: cleanSnippet,
        body: articleBody,
        source: feed.name,
        minWordCount
    });

    if (!allowed) {
        console.log(
            `Filtered item from ${feed.name} (${feed.type}): "${title}" skipped (${reason})`
        );
        return null;
    }

    const editorialPackage = await createEditorialPackage({
        title,
        snippet: cleanSnippet,
        body: articleBody,
        source: feed.name,
        category: feed.category
    });

    // If AI summarization failed after all retries, skip this article
    if (!editorialPackage) {
        console.log(`Skipped item from ${feed.name}: "${title}" - AI summarization failed after retries.`);
        return null;
    }
    if (metrics) {
        metrics.articlesSummarizedCount += 1;
    }

    const summary = editorialPackage.content || editorialPackage.formattedSummary || cleanSnippet;
    const importanceScore = calculateImportanceScore(title, summary, feed.name);

    const minImportance = feed.is_research ? 5 : 6;
    if (importanceScore < minImportance) {
        return null;
    }

    const imageUrl = await resolveArticleImage({
        item,
        title,
        summary,
        category: feed.category,
        source: feed.name
    });

    return {
        title: title.slice(0, 200),
        summary, // Store the full long-form article here
        category: feed.category,
        source: feed.name,
        source_url: sourceUrl,
        image_url: imageUrl,
        importance_score: importanceScore,
        is_featured: importanceScore >= 9,
        published_at: toIsoDate(item)
    };
}

export async function fetchNews(metrics = {
    articlesFetchedCount: 0,
    articlesSummarizedCount: 0,
    upsertedCount: 0
}, options = {}) {
    const allArticles = [];
    const selfTest = options?.selfTest === true || process.env.SELF_TEST === 'true';
    const maxArticles = selfTest ? 5 : Infinity;
    const maxSourcesPerRun = getMaxSourcesPerRun(selfTest);
    const feeds = await buildFeedList();
    const rssFeeds = feeds.filter(
        (feed) => typeof feed.url === 'string' && feed.url.startsWith('http')
    );
    const apiFeeds = feeds.filter((feed) => feed.type === 'research_platform_api');

    const selectedFeeds = [...rssFeeds, ...apiFeeds].slice(0, maxSourcesPerRun);

    async function fetchHuggingFaceModels(feed) {
        // Public API: returns recently modified models.
        const endpoint =
            'https://huggingface.co/api/models?sort=lastModified&direction=-1&limit=20';
        const response = await fetch(endpoint);
        if (!response.ok) {
            const body = await response.text();
            throw new Error(
                `Hugging Face models API failed (${response.status}): ${body}`
            );
        }
        const models = (await response.json()) || [];
        const now = new Date().toISOString();

        const modelItems = models
            .filter((m) => m?.id)
            .slice(0, 15)
            .map((m) => ({
                title: `Model update: ${m.id}`,
                link: `https://huggingface.co/${m.id}`,
                isoDate: m.lastModified || now,
                contentSnippet: `Pipeline: ${m.pipeline_tag || 'unknown'}. Tags: ${(m.tags || [])
                    .slice(0, 6)
                    .join(', ')}.`
            }));

        metrics.articlesFetchedCount += modelItems.length;
        return modelItems.map((item) => buildArticleRecord(item, feed, metrics));
    }

    for (const feed of selectedFeeds) {
        if (allArticles.length >= maxArticles) break;
        try {
            if (feed.type === 'research_platform_api') {
                console.log(`Fetching from ${feed.name} (API)...`);
                const candidates = await Promise.all(
                    await fetchHuggingFaceModels(feed)
                );
                const filteredArticles = candidates.filter(
                    (article) => article !== null
                );
                allArticles.push(...filteredArticles.slice(0, maxArticles - allArticles.length));
                console.log(
                    `Found ${filteredArticles.length} important items from ${feed.name}`
                );
                continue;
            }

            console.log(`Fetching from ${feed.name}...`);
            const res = await fetch(feed.url, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (compatible; NewsFetcher/1.0; +https://example.com)',
                    Accept:
                        'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, text/html;q=0.8'
                }
            });
            if (!res.ok) {
                const body = await res.text();
                throw new Error(
                    `HTTP ${res.status} fetching feed: ${body.slice(0, 180)}`
                );
            }
            const contentType = res.headers.get('content-type') || '';
            const raw = await res.text();
            // Strip BOM and any leading non-XML noise (some providers prepend text).
            const bomStripped = raw.replace(/^\uFEFF/, '');
            const firstTag = bomStripped.indexOf('<');
            const xml = firstTag > 0 ? bomStripped.slice(firstTag) : bomStripped;
            const trimmed = xml.trimStart();
            if (!trimmed.startsWith('<')) {
                throw new Error(
                    `Non-XML feed response (content-type: ${contentType || 'unknown'}): ${trimmed.slice(
                        0,
                        120
                    )}`
                );
            }

            const feedData = await parser.parseString(xml);
            const items = feedData.items ?? [];
            const selectedItems = items.slice(0, 15);
            metrics.articlesFetchedCount += selectedItems.length;
            const candidateArticles = await Promise.all(
                selectedItems.map((item) => buildArticleRecord(item, feed, metrics))
            );

            const filteredArticles = candidateArticles.filter(
                (article) => article !== null
            );
            allArticles.push(...filteredArticles.slice(0, maxArticles - allArticles.length));

            console.log(
                `Found ${filteredArticles.length} important articles from ${feed.name}`
            );
        } catch (error) {
            logErrorDetails(`Error fetching ${feed.name}`, error);
        }
    }

    if (!allArticles.length) {
        console.log('No articles met the importance threshold.');
        return { success: true, message: 'No articles found', articles: [], count: 0 };
    }

    console.log(`Upserting ${allArticles.length} articles into database...`);

    const incomingUrls = [...new Set(allArticles.map((a) => a.source_url).filter(Boolean))];
    const existingImageMap = new Map();
    if (incomingUrls.length) {
        const { data: existingRows, error: existingError } = await supabase
            .from('news_articles')
            .select('source_url, image_url')
            .in('source_url', incomingUrls);

        if (existingError) {
            logSupabaseError(
                'Unable to prefetch existing images for merge protection',
                existingRows,
                existingError
            );
        } else {
            for (const row of existingRows || []) {
                if (row?.source_url) {
                    existingImageMap.set(row.source_url, row.image_url);
                }
            }
        }
    }

    const isRenderableImageUrl = (value) => {
        if (value == null) return false;
        const url = String(value).trim();
        if (!url || url === 'null' || url === 'undefined') return false;
        if (url.startsWith('data:image/')) return true;
        return url.startsWith('https://') || url.startsWith('http://');
    };

    const isGenericFallbackUrl = (value) => {
        if (!value) return false;
        const url = String(value).trim();
        return (
            url.startsWith('https://source.unsplash.com/featured/') ||
            url.startsWith('http://source.unsplash.com/featured/')
        );
    };

    const mergedArticles = allArticles.map((article) => {
        const existingImage = existingImageMap.get(article.source_url);
        const incomingImage = article.image_url;

        // Protect enriched/known-good images from being overwritten with null/invalid/fallback.
        if (
            isRenderableImageUrl(existingImage) &&
            !isGenericFallbackUrl(existingImage) &&
            (!isRenderableImageUrl(incomingImage) || isGenericFallbackUrl(incomingImage))
        ) {
            return {
                ...article,
                image_url: existingImage
            };
        }

        return article;
    });

    const { data, error } = await supabase
        .from('news_articles')
        .upsert(mergedArticles, {
            onConflict: 'source_url',
            ignoreDuplicates: false
        })
        .select();

    if (error) {
        logSupabaseError('Database upsert error', data, error);
        throw error;
    }

    const count = data?.length ?? 0;
    metrics.upsertedCount = count;
    console.log(`Successfully upserted ${count} articles`);

    return {
        success: true,
        message: `Upserted ${count} news articles`,
        articles: data ?? [],
        count
    };
}

app.post('/api/newsletter/subscribe', newsletterRateLimit, async (req, res) => {
    const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    if (!rawEmail) {
        return res.status(400).json({
            success: false,
            error: 'Email is required.'
        });
    }

    const email = rawEmail.toLowerCase();
    if (email.length < 5 || email.length > 255 || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid email address.'
        });
    }

    const rawSource = typeof req.body?.source === 'string' ? req.body.source.trim() : '';
    const sanitizedSource = rawSource ? sanitizeSourceTag(rawSource).slice(0, 100) : '';
    const source = sanitizedSource || null;

    try {
        const { data, error } = await supabase
            .from('newsletter_subscribers')
            .insert({
                email,
                source
            })
            .select('id, created_at')
            .single();

        if (error) {
            const duplicate = error.code === '23505' || (error.message && error.message.toLowerCase().includes('duplicate key'));
            if (duplicate) {
                return res.status(409).json({
                    success: false,
                    error: 'Looks like you are already subscribed.'
                });
            }

            const dbErrorMessage = error?.message ?? 'Unknown database error';
            logSupabaseError('Newsletter subscription insert failed', data, error);
            throw error;
        }

        return res.status(200).json({
            success: true,
            data: {
                id: data.id,
                created_at: data.created_at
            },
            message: 'Thanks for subscribing!'
        });
    } catch (err) {
        logErrorDetails('Newsletter subscription error', err);
        return res.status(500).json({
            success: false,
            error: 'Unable to complete subscription right now. Please try again later.'
        });
    }
});

app.get('/api/admin/newsletter/stats', adminRateLimit, requireAdminApiKey, async (_req, res) => {
    try {
        const { count, error } = await supabase
            .from('newsletter_subscribers')
            .select('id', { count: 'exact', head: true });

        if (error) {
            logSupabaseError('Newsletter stats select failed', null, error);
            throw error;
        }

        return res.json({
            success: true,
            data: {
                subscriberCount: count ?? 0
            }
        });
    } catch (error) {
        logErrorDetails('Newsletter stats error', error);
        return res.status(500).json({
            success: false,
            error: 'Unable to fetch stats right now.'
        });
    }
});

app.post('/api/admin/authenticate', adminRateLimit, requireAdminApiKey, (_req, res) => {
    res.json({ success: true });
});

app.post('/api/fetch-news', adminRateLimit, requireAdminApiKey, async (req, res) => {
    const metrics = {
        articlesFetchedCount: 0,
        articlesSummarizedCount: 0,
        upsertedCount: 0
    };
    try {
        const isSelfTest = req.get('x-self-test') === 'true';
        if (req.get('x-self-test') === 'true') {
            process.env.SELF_TEST = 'true';
        }
        const result = await fetchNews(metrics, { selfTest: isSelfTest });
        const debug = buildDebugInfo(metrics);
        res.json({ ...result, debug });
    } catch (error) {
        logErrorDetails('Fetch news failed', error);
        const debug = buildDebugInfo(metrics);
        res.status(500).json({
            success: false,
            error: error.message,
            debug
        });
    }
});

app.use((err, _req, res, _next) => {
    if (err && err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            error: 'Origin not allowed'
        });
    }

    console.error('Unexpected server error:', err);
    return res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

const PORT = process.env.PORT || 3001;
const AUTO_FETCH_NEWS_MINUTES = Number.parseInt(
    process.env.AUTO_FETCH_NEWS_MINUTES || '0',
    10
);
let autoFetchInProgress = false;

async function runAutoFetch() {
    if (autoFetchInProgress) return;
    autoFetchInProgress = true;
    try {
        await fetchNews();
    } catch (err) {
        logErrorDetails('Auto fetch failed', err);
    } finally {
        autoFetchInProgress = false;
    }
}

if (process.argv.includes('--run-now')) {
    fetchNews()
        .then(() => {
            console.log('Fetch complete.');
        })
        .catch((err) => {
            logErrorDetails('Fetch failed', err);
        });
} else {
    app.listen(PORT, () => {
        console.log(`News fetcher server running on http://localhost:${PORT}`);

        if (AUTO_FETCH_NEWS_MINUTES > 0) {
            console.log(
                `Auto-fetch enabled: running every ${AUTO_FETCH_NEWS_MINUTES} minute(s).`
            );
            runAutoFetch();
            setInterval(
                runAutoFetch,
                AUTO_FETCH_NEWS_MINUTES * 60 * 1000
            );
        }
    });
}
