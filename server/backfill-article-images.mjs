import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingEnv = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnv.length) {
    console.error(
        `Missing required environment variables: ${missingEnv.join(', ')}`
    );
    process.exit(1);
}

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || '';

if (!UNSPLASH_ACCESS_KEY && !PIXABAY_API_KEY) {
    console.error(
        'Missing image provider key: set UNSPLASH_ACCESS_KEY and/or PIXABAY_API_KEY.'
    );
    process.exit(1);
}
const BATCH_SIZE = Number.parseInt(
    process.env.IMAGE_BACKFILL_BATCH_SIZE || '15',
    10
);
const MAX_QUERIES_PER_ARTICLE = 4;
const MIN_RELEVANCE_SCORE = 1;
const UNSPLASH_API = 'https://api.unsplash.com';
const PIXABAY_API = 'https://pixabay.com/api/';
const REQUEST_DELAY_MS = 450;
let unsplashRateLimited = false;

const CATEGORY_FALLBACK_IMAGES = {
    Technology:
        'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200&q=80&auto=format&fit=crop',
    Research:
        'https://images.unsplash.com/photo-1559757175-5700dde67538?w=1200&q=80&auto=format&fit=crop',
    Business:
        'https://images.unsplash.com/photo-1454165205744-3b78555e5572?w=1200&q=80&auto=format&fit=crop',
    Robotics:
        'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1200&q=80&auto=format&fit=crop',
    Tools:
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80&auto=format&fit=crop',
    'AI Tools':
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80&auto=format&fit=crop'
};

const categoryFallbackFor = (category) =>
    CATEGORY_FALLBACK_IMAGES[category] ||
    'https://images.unsplash.com/photo-1558494949-ef527443d01d?w=1200&q=80&auto=format&fit=crop';

const STOPWORDS = new Set([
    'the',
    'and',
    'for',
    'are',
    'with',
    'that',
    'this',
    'from',
    'have',
    'has',
    'will',
    'about',
    'into',
    'their',
    'they',
    'them',
    'its',
    'been',
    'was',
    'were',
    'while',
    'where',
    'when',
    'your',
    'our',
    'you',
    'but',
    'can',
    'just',
    'than',
    'also',
    'any',
    'each',
    'other',
    'more',
    'over',
    'after',
    'before',
    'under',
    'between',
    'which',
    'would',
    'should',
    'could',
    'how',
    'who',
    'what',
    'why',
    'because',
    'during',
    'including',
    'across',
    'among',
    'once',
    'both',
    'being',
    'per',
    'such',
    'very',
    'via',
    'every',
    'still',
    'many',
    'much',
    'new',
    'latest'
]);

const GENERIC_TAGS = new Set([
    'abstract',
    'background',
    'wallpaper',
    'texture',
    'pattern',
    'gradient',
    'design',
    'creative',
    'illustration',
    'art',
    'sunset',
    'landscape',
    'nature',
    'flower',
    'sky',
    'beach',
    'forest'
]);

const AI_FOCUS_KEYWORDS = [
    'ai',
    'artificial intelligence',
    'machine learning',
    'technology',
    'robotics',
    'automation',
    'data center',
    'semiconductor',
    'chip',
    'research',
    'enterprise',
    'software'
];

const sleep = (ms) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

const normalizeWhitespace = (value = '') =>
    value.replace(/\s+/g, ' ').trim();

const cleanTitle = (title = '') => {
    if (!title) return '';
    const primary = title.split(/[-–:|]/)[0] || title;
    return normalizeWhitespace(primary.replace(/["'`]/g, ''));
};

const tokenize = (text = '') =>
    text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((token) => token && token.length > 2 && !STOPWORDS.has(token));

const aggregateKeywords = (article) => {
    const parts = [
        article.title || '',
        article.summary || '',
        article.category || '',
        article.source || ''
    ];

    const freqMap = new Map();

    for (const part of parts) {
        for (const token of tokenize(part)) {
            freqMap.set(token, (freqMap.get(token) || 0) + 1);
        }
    }

    const ranked = [...freqMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([token]) => token);

    const keywords = [];
    for (const token of ranked) {
        if (!keywords.includes(token)) {
            keywords.push(token);
        }
        if (keywords.length >= 8) break;
    }

    for (const focus of AI_FOCUS_KEYWORDS) {
        if (!keywords.includes(focus)) {
            keywords.push(focus);
        }
    }

    return keywords.slice(0, 10);
};

const buildSearchQueries = (article, keywords) => {
    const compactKeywords = keywords.slice(0, 3).join(' ');
    const broaderKeywords = keywords.slice(0, 5).join(' ');
    const title = cleanTitle(article.title || '');
    const category = (article.category || '').toLowerCase();

    const candidates = [
        `${title} ${compactKeywords}`,
        `${title} ${category}`,
        `${category} ${compactKeywords}`,
        `${broaderKeywords} ${category}`,
        `${compactKeywords} artificial intelligence`
    ]
        .map((query) => normalizeWhitespace(query))
        .filter(Boolean);

    return [...new Set(candidates)].slice(0, MAX_QUERIES_PER_ARTICLE);
};

const buildPhotoVocabulary = (photo) => {
    const tags = (photo.tags || []).map(
        (tag) => tag?.title || tag?.source?.title || ''
    );

    const topicLabels = Object.entries(photo.topic_submissions || {})
        .filter(([, meta]) => meta?.status === 'approved')
        .map(([topic]) => topic.replace(/[-_]/g, ' '));

    return normalizeWhitespace(
        [
            photo.description,
            photo.alt_description,
            photo.location?.name,
            photo.user?.name,
            ...tags,
            ...topicLabels
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
    );
};

const hasGenericTag = (photo) =>
    (photo.tags || []).some((tag) =>
        GENERIC_TAGS.has((tag?.title || '').toLowerCase())
    );

const scorePhotoForArticle = (photo, article, keywords) => {
    const vocabulary = buildPhotoVocabulary(photo);
    if (!vocabulary) return 0;
    let score = 0;

    for (const keyword of keywords) {
        const normalized = keyword.toLowerCase();
        if (!normalized || normalized.length < 2) continue;
        if (vocabulary.includes(normalized)) {
            score += normalized.length >= 6 ? 2 : 1;
        }
    }

    if (article.category) {
        const cat = article.category.toLowerCase();
        if (vocabulary.includes(cat)) {
            score += 1;
        }
    }

    if (photo.topic_submissions?.technology?.status === 'approved') {
        score += 1.5;
    }

    if (photo.topic_submissions?.['current-events']?.status === 'approved') {
        score += 1;
    }

    if (hasGenericTag(photo)) {
        score -= 1;
    }

    const altText = (photo.alt_description || '').toLowerCase();
    if (altText.includes('copy space') || altText.includes('background')) {
        score -= 1;
    }

    return score;
};

const selectRelevantPhoto = (photos, article, keywords) => {
    const ranked = photos
        .map((photo) => ({
            photo,
            score: scorePhotoForArticle(photo, article, keywords)
        }))
        .filter((entry) => Number.isFinite(entry.score))
        .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    if (best && best.score >= MIN_RELEVANCE_SCORE) {
        return best;
    }
    return null;
};

async function searchUnsplash(query) {
    if (!UNSPLASH_ACCESS_KEY) return [];
    if (unsplashRateLimited) return [];
    const params = new URLSearchParams({
        query,
        per_page: '12',
        order_by: 'relevant',
        content_filter: 'high',
        orientation: 'landscape'
    });

    const response = await fetch(`${UNSPLASH_API}/search/photos?${params}`, {
        headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            'Accept-Version': 'v1'
        }
    });

    if (!response.ok) {
        const errorBody = await response.text();
        if (
            response.status === 403 &&
            typeof errorBody === 'string' &&
            errorBody.toLowerCase().includes('rate limit')
        ) {
            unsplashRateLimited = true;
            console.warn(
                'Unsplash rate limit exceeded; skipping further Unsplash calls in this run.'
            );
            return [];
        }
        throw new Error(
            `Unsplash request failed (${response.status}): ${errorBody}`
        );
    }

    const payload = await response.json();
    return payload.results || [];
}

const normalizePixabayTags = (tags = '') =>
    tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((title) => ({ title }));

const normalizePixabayPhoto = (hit) => ({
    description: hit.tags || '',
    alt_description: hit.tags || '',
    location: { name: hit.user || '' },
    user: { name: hit.user || '' },
    tags: normalizePixabayTags(hit.tags),
    topic_submissions: {}, // Pixabay lacks topic metadata
    links: { html: hit.pageURL },
    urls: {
        regular:
            hit.largeImageURL ||
            hit.webformatURL ||
            hit.fullHDURL ||
            hit.previewURL,
        full:
            hit.fullHDURL ||
            hit.largeImageURL ||
            hit.webformatURL ||
            hit.previewURL
    }
});

async function searchPixabay(query) {
    if (!PIXABAY_API_KEY) {
        return [];
    }

    const params = new URLSearchParams({
        key: PIXABAY_API_KEY,
        q: query,
        per_page: '20',
        orientation: 'horizontal',
        safesearch: 'true',
        image_type: 'photo',
        editors_choice: 'true'
    });

    const response = await fetch(`${PIXABAY_API}?${params.toString()}`);
    if (!response.ok) {
        const body = await response.text();
        throw new Error(
            `Pixabay request failed (${response.status}): ${body}`
        );
    }

    const payload = await response.json();
    return (payload.hits || []).map(normalizePixabayPhoto);
}

async function resolveImageUrl(article) {
    const keywords = aggregateKeywords(article);
    const queries = buildSearchQueries(article, keywords);

    for (const query of queries) {
        try {
            const results = await searchUnsplash(query);
            if (!results.length) {
                console.warn(
                    `Unsplash returned no results for "${query}" (${article.title})`
                );
                // Keep going; Pixabay may still succeed for the same query.
            }

            const selected = selectRelevantPhoto(results, article, keywords);
            if (selected) {
                return {
                    url: selected.photo.urls?.regular || selected.photo.urls?.full,
                    photographer: selected.photo.user?.name || 'Unknown',
                    attribution: selected.photo.links?.html,
                    query,
                    score: selected.score,
                    provider: 'unsplash'
                };
            }

            if (results.length) {
                console.warn(
                    `Top Unsplash result below relevance threshold for "${query}" (score < ${MIN_RELEVANCE_SCORE})`
                );
            }
        } catch (error) {
            console.error(`Unsplash request failed for "${query}":`, error.message);
        }

        if (PIXABAY_API_KEY) {
            try {
                const pixabayResults = await searchPixabay(query);
                if (!pixabayResults.length) {
                    console.warn(
                        `Pixabay returned no results for "${query}" (${article.title})`
                    );
                } else {
                    const selected = selectRelevantPhoto(
                        pixabayResults,
                        article,
                        keywords
                    );
                    if (selected) {
                        return {
                            url:
                                selected.photo.urls?.regular ||
                                selected.photo.urls?.full,
                            photographer: selected.photo.user?.name || 'Unknown',
                            attribution: 'https://pixabay.com/',
                            query,
                            score: selected.score,
                            provider: 'pixabay'
                        };
                    }

                    console.warn(
                        `Top Pixabay result below relevance threshold for "${query}" (score < ${MIN_RELEVANCE_SCORE})`
                    );
                }
            } catch (error) {
                console.error(
                    `Pixabay request failed for "${query}":`,
                    error.message
                );
            }
        }

        await sleep(REQUEST_DELAY_MS);
    }

    return {
        url: categoryFallbackFor(article.category),
        photographer: 'Unsplash (curated)',
        attribution: 'https://unsplash.com/',
        query: 'category-fallback',
        score: 0,
        provider: 'fallback'
    };
}

async function fetchArticlesNeedingImages(limit = BATCH_SIZE) {
    const filter =
        'image_url.is.null,image_url.eq.,image_url.ilike.data:%,image_url.ilike.https://source.unsplash.com/featured/%,image_url.like./%,image_url.like.//%';

    const { data, error } = await supabase
        .from('news_articles')
        .select('id, title, summary, category, source, image_url')
        .or(filter)
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error) {
        throw error;
    }

    return data || [];
}

async function updateArticleImage(id, imageUrl) {
    const { error } = await supabase
        .from('news_articles')
        .update({ image_url: imageUrl })
        .eq('id', id);

    if (error) {
        throw error;
    }
}

async function backfillImages() {
    let processed = 0;
    let updated = 0;

    const articles = await fetchArticlesNeedingImages();
    if (!articles.length) {
        console.log('No articles matched the backfill filter.');
        return;
    }

    for (const article of articles) {
        processed += 1;
        console.log(
            `Processing "${article.title}" (${article.category}) [${processed}/${articles.length}]`
        );

        try {
            const resolved = await resolveImageUrl(article);
            if (!resolved?.url) {
                console.warn(`No suitable image found for "${article.title}"`);
                continue;
            }

            await updateArticleImage(article.id, resolved.url);
            updated += 1;
            const provider = resolved.provider || 'unknown';
            console.log(
                `Updated article ${article.id} with ${resolved.url} (provider: ${provider}, query: "${resolved.query}", score: ${resolved.score.toFixed(
                    2
                )})`
            );
            await sleep(350);
        } catch (error) {
            console.error(`Failed to update "${article.title}":`, error.message);
        }
    }

    console.log(
        `Backfill complete. Processed ${processed} article(s), updated ${updated}.`
    );
}

backfillImages().catch((error) => {
    console.error('Image backfill failed:', error);
    process.exit(1);
});
