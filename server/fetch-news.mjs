import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import dotenv from 'dotenv';
import he from 'he';
import { load as loadHtml } from 'cheerio';
import categoriesConfig from '../shared/article-categories.json' assert { type: 'json' };

dotenv.config();

const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ADMIN_API_KEY',
    'API_ALLOWED_ORIGINS'
];
const missingEnv = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnv.length) {
    throw new Error(
        `Missing required environment variables: ${missingEnv.join(', ')}`
    );
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
const parser = new Parser();
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

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const rateLimitBuckets = new Map();

const rateLimit = (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = rateLimitBuckets.get(ip) || { count: 0, start: now };

    if (now - bucket.start >= RATE_LIMIT_WINDOW_MS) {
        bucket.count = 0;
        bucket.start = now;
    }

    bucket.count += 1;
    rateLimitBuckets.set(ip, bucket);

    if (bucket.count > RATE_LIMIT_MAX_REQUESTS) {
        return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded. Try again later.'
        });
    }

    return next();
};

const requireAdminApiKey = (req, res, next) => {
    const providedKey = req.get('x-api-key');
    if (!providedKey || providedKey !== ADMIN_API_KEY) {
        console.warn(`Unauthorized access attempt blocked for route ${req.path} from IP ${req.ip}`);
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

const RAW_RSS_FEEDS = [
    // Major Tech News
    {
        name: 'TechCrunch AI',
        url: 'https://techcrunch.com/tag/artificial-intelligence/feed/',
        category: 'Technology'
    },
    {
        name: 'VentureBeat AI',
        url: 'https://venturebeat.com/category/ai/feed/',
        category: 'Technology'
    },
    {
        name: 'The Verge AI',
        url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
        category: 'Technology'
    },
    {
        name: 'Ars Technica AI',
        url: 'https://arstechnica.com/tag/artificial-intelligence/feed/',
        category: 'Technology'
    },
    {
        name: 'Wired AI',
        url: 'https://www.wired.com/feed/tag/ai/latest/rss',
        category: 'Technology'
    },

    // Research & Academic
    {
        name: 'MIT Technology Review',
        url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
        category: 'Research'
    },
    {
        name: 'AI News',
        url: 'https://www.artificialintelligence-news.com/feed/',
        category: 'Research'
    },

    // Industry Specific
    {
        name: 'AI Business',
        url: 'https://aibusiness.com/rss.xml',
        category: 'Business'
    },
    {
        name: 'Machine Learning Mastery',
        url: 'https://machinelearningmastery.com/feed/',
        category: 'Research'
    },

    // General Tech (with AI coverage)
    {
        name: 'Reuters Technology',
        url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
        category: 'Technology'
    },
    {
        name: 'ZDNet AI',
        url: 'https://www.zdnet.com/topic/artificial-intelligence/rss.xml',
        category: 'Technology'
    }
];

const RSS_FEEDS = RAW_RSS_FEEDS.map((feed) => ({
    ...feed,
    category: ensureCategory(feed.category)
}));

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
    requiredKeywords: [
        'ai',
        'artificial intelligence',
        'machine learning',
        'ml',
        'neural',
        'automation',
        'robotics',
        'data',
        'model'
    ],
    bannedPatterns: [/sponsored/i, /newsletter/i, /giveaway/i, /subscribe/i],
    bannedTopics: [
        'politics',
        'election',
        'president',
        'parliament',
        'senate',
        'campaign',
        'government',
        'policy debate',
        'geopolitics',
        'war',
        'conflict',
        'gaza',
        'israel',
        'palestine',
        'ukraine',
        'russia',
        'iran',
        'north korea',
        'trump',
        'biden'
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
    } catch {
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
        } catch {}
    });

    return urls
        .map((u) => absoluteUrl(u, base))
        .filter((u) => typeof u === "string" && u.startsWith("http"));
}

export function extractImageUrl(item = {}) {
    const base = item.link || "";

    const candidates = [];

    // enclosure tags
    if (item.enclosure?.url) candidates.push(item.enclosure.url);

    // media:content
    if (item["media:content"]?.url) candidates.push(item["media:content"].url);

    // HTML fields
    candidates.push(...extractHtmlImages(item.content, base));
    candidates.push(...extractHtmlImages(item.description, base));
    candidates.push(...extractHtmlImages(item.summary, base));

    const unique = [...new Set(candidates)];

    const valid = unique.filter((url) =>
        /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(url)
    );

    if (valid.length > 0) return valid[0];

    // FIX: ensure no fake or irrelevant images
    return selectFallbackImage(item.title || '', base);
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
        console.error('Hugging Face image generation failed:', error.message);
        return null;
    }
}

async function resolveArticleImage({ item, title, summary, category, source }) {
    const existing = extractImageUrl(item);
    if (existing && !isGeneratedFallback(existing)) {
        return existing;
    }

    const prompt = buildImagePrompt({ title, summary, category, source });
    const generated = await requestHuggingFaceImage(prompt);
    if (generated) {
        return generated;
    }

    return existing || selectFallbackImage(title || '', item.link || '');
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

function createEditorialPackage({ title, snippet, body, source }) {
    const combined = [snippet, body].filter(Boolean).join(' ').trim();
    if (!combined) {
        return {
            formattedSummary: sanitizeText(snippet || body || title || ''),
            keywords: [],
            highlights: []
        };
    }

    const sentences = splitIntoSentences(combined);
    const freqMap = buildFrequencyMap(combined);
    const summarySentences = selectTopSentences(sentences, freqMap, 3);
    const remainingSentences = sentences.filter(
        (sentence) => !summarySentences.includes(sentence)
    );
    const highlights = selectTopSentences(remainingSentences, freqMap, 3);
    const keywords = extractTopKeywords(freqMap, 5);
    const narrative = buildNarrativeParagraph(title, source, keywords);
    const formattedSummary = formatEditorialSummary({
        summarySentences,
        highlights,
        keywords,
        narrative
    });

    return {
        formattedSummary,
        keywords,
        highlights
    };
}

function applyContentFilters({ title, summary, body, source }) {
    const combined = [title, summary, body].filter(Boolean).join(' ').toLowerCase();
    const wordCount = combined.split(/\s+/).filter(Boolean).length;

    if (wordCount < CONTENT_FILTER_RULES.minWordCount) {
        return { allowed: false, reason: 'insufficient word count' };
    }

    if (
        !CONTENT_FILTER_RULES.requiredKeywords.some((keyword) =>
            combined.includes(keyword)
        )
    ) {
        return { allowed: false, reason: 'missing AI keyword' };
    }

    if (CONTENT_FILTER_RULES.bannedPatterns.some((pattern) => pattern.test(combined))) {
        return { allowed: false, reason: 'banned content pattern' };
    }

    if (
        CONTENT_FILTER_RULES.bannedTopics.some((topic) =>
            combined.includes(topic.toLowerCase())
        )
    ) {
        return { allowed: false, reason: 'banned topic (political/geo conflict)' };
    }

    return { allowed: true };
}

function toIsoDate(item) {
    if (item.isoDate) return new Date(item.isoDate).toISOString();
    if (item.pubDate) return new Date(item.pubDate).toISOString();
    return new Date().toISOString();
}

async function buildArticleRecord(item, feed) {
    const title = sanitizeText(item.title) || 'No title';
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

    const { allowed, reason } = applyContentFilters({
        title,
        summary: cleanSnippet,
        body: articleBody,
        source: feed.name
    });

    if (!allowed) {
        console.log(
            `Filtered article from ${feed.name}: "${title}" skipped (${reason})`
        );
        return null;
    }

    const editorialPackage = createEditorialPackage({
        title,
        snippet: cleanSnippet,
        body: articleBody,
        source: feed.name
    });

    const summary = editorialPackage.formattedSummary || cleanSnippet;
    const importanceScore = calculateImportanceScore(title, summary, feed.name);

    if (importanceScore < 6) {
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
        summary,
        category: feed.category,
        source: feed.name,
        source_url: item.link || '#',
        image_url: imageUrl,
        importance_score: importanceScore,
        is_featured: importanceScore >= 9,
        published_at: toIsoDate(item)
    };
}

export async function fetchNews() {
    const allArticles = [];

    for (const feed of RSS_FEEDS) {
        try {
            console.log(`Fetching from ${feed.name}...`);
            const feedData = await parser.parseURL(feed.url);
            const items = feedData.items ?? [];
            const candidateArticles = await Promise.all(
                items
                    .slice(0, 15)
                    .map((item) => buildArticleRecord(item, feed))
            );

            const filteredArticles = candidateArticles.filter(
                (article) => article !== null
            );
            allArticles.push(...filteredArticles);

            console.log(
                `Found ${filteredArticles.length} important articles from ${feed.name}`
            );
        } catch (error) {
            console.error(`Error fetching ${feed.name}:`, error.message);
        }
    }

    if (!allArticles.length) {
        console.log('No articles met the importance threshold.');
        return { success: true, message: 'No articles found', articles: [], count: 0 };
    }

    console.log(`Upserting ${allArticles.length} articles into database...`);

    const { data, error } = await supabase
        .from('news_articles')
        .upsert(allArticles, {
            onConflict: 'source_url',
            ignoreDuplicates: false
        })
        .select();

    if (error) {
        console.error('Database error:', error);
        throw error;
    }

    const count = data?.length ?? 0;
    console.log(`Successfully upserted ${count} articles`);

    return {
        success: true,
        message: `Upserted ${count} news articles`,
        articles: data ?? [],
        count
    };
}

app.post('/api/admin/authenticate', rateLimit, requireAdminApiKey, (_req, res) => {
    res.json({ success: true });
});

app.post('/api/fetch-news', rateLimit, requireAdminApiKey, async (_req, res) => {
    try {
        const result = await fetchNews();
        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
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

if (process.argv.includes('--run-now')) {
    fetchNews()
        .then(() => {
            console.log('Fetch complete.');
        })
        .catch((err) => {
            console.error('Fetch failed:', err);
        });
} else {
    app.listen(PORT, () => {
        console.log(`News fetcher server running on http://localhost:${PORT}`);
    });
}
