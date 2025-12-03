import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';

dotenv.config();

const app = express();
const parser = new Parser();

app.use(cors());
app.use(express.json());

console.log('Connecting to Supabase URL:', process.env.VITE_SUPABASE_URL);
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RSS_FEEDS = [
    // Major Tech News
    {
        name: "TechCrunch AI",
        url: "https://techcrunch.com/tag/artificial-intelligence/feed/",
        category: "Technology"
    },
    {
        name: "VentureBeat AI",
        url: "https://venturebeat.com/category/ai/feed/",
        category: "Technology"
    },
    {
        name: "The Verge AI",
        url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
        category: "Technology"
    },
    {
        name: "Ars Technica AI",
        url: "https://arstechnica.com/tag/artificial-intelligence/feed/",
        category: "Technology"
    },
    {
        name: "Wired AI",
        url: "https://www.wired.com/feed/tag/ai/latest/rss",
        category: "Technology"
    },

    // Research & Academic
    {
        name: "MIT Technology Review",
        url: "https://www.technologyreview.com/topic/artificial-intelligence/feed",
        category: "Research"
    },
    {
        name: "AI News",
        url: "https://www.artificialintelligence-news.com/feed/",
        category: "Research"
    },

    // Industry Specific
    {
        name: "AI Business",
        url: "https://aibusiness.com/rss.xml",
        category: "Business"
    },
    {
        name: "Machine Learning Mastery",
        url: "https://machinelearningmastery.com/feed/",
        category: "Research"
    },

    // General Tech (with AI coverage)
    {
        name: "Reuters Technology",
        url: "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best",
        category: "Technology"
    },
    {
        name: "ZDNet AI",
        url: "https://www.zdnet.com/topic/artificial-intelligence/rss.xml",
        category: "Technology"
    },
];

// Keywords that indicate important AI news
const IMPORTANT_KEYWORDS = [
    // Major Companies
    'openai', 'google', 'microsoft', 'meta', 'anthropic', 'deepmind', 'nvidia',
    // Major Products
    'gpt', 'chatgpt', 'gemini', 'claude', 'copilot', 'bard',
    // Important Events
    'breakthrough', 'launch', 'release', 'announces', 'unveils', 'acquisition',
    // Research Terms
    'research', 'model', 'algorithm', 'neural network', 'machine learning',
    // Impact Terms
    'regulation', 'policy', 'lawsuit', 'controversy', 'ethics', 'safety',
    // Business Terms
    'funding', 'investment', 'billion', 'million', 'ipo', 'partnership'
];

// Calculate importance score based on content
function calculateImportanceScore(title, summary, source) {
    let score = 5; // Base score

    const text = `${title} ${summary}`.toLowerCase();

    // Check for important keywords
    const keywordMatches = IMPORTANT_KEYWORDS.filter(keyword =>
        text.includes(keyword.toLowerCase())
    );
    score += Math.min(keywordMatches.length, 5); // Up to +5 for keywords

    // Boost for reputable sources
    const prestigiousSources = ['MIT Technology Review', 'TechCrunch AI', 'Reuters Technology', 'VentureBeat AI'];
    if (prestigiousSources.includes(source)) {
        score += 2;
    }


    for (const feed of RSS_FEEDS) {
        try {
            console.log(`Fetching from ${feed.name}...`);
            const feedData = await parser.parseURL(feed.url);

            // Process items in parallel batches to speed up OG fetching
            const itemsToProcess = feedData.items.slice(0, 10);
            const articlePromises = itemsToProcess.map(async (item) => {
                const title = item.title?.substring(0, 200) || 'No title';
                const summary = item.contentSnippet?.substring(0, 300) || item.content?.substring(0, 300) || 'No summary available';
                const importanceScore = calculateImportanceScore(title, summary, feed.name);

                if (importanceScore < 6) return null;

                const imageUrl = await extractImageUrl(item, feed.category);

                return {
                    title,
                    summary,
                    category: feed.category,
                    source: feed.name,
                    source_url: item.link || '#',
                    image_url: imageUrl,
                    importance_score: importanceScore,
                    is_featured: importanceScore >= 9,
                    published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                };
            });

            const articles = (await Promise.all(articlePromises)).filter(a => a !== null);

            allArticles.push(...articles);
            console.log(`Found ${articles.length} important articles from ${feed.name}`);
        } catch (error) {
            console.error(`Error fetching ${feed.name}:`, error.message);
        }
    }

    if (allArticles.length === 0) {
        console.log('No articles found.');
        return { success: true, message: 'No articles found', count: 0 };
    }

    console.log(`Upserting ${allArticles.length} articles into database...`);

    // Use upsert to avoid duplicate errors
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

    console.log(`Successfully upserted ${data?.length} articles`);
    return {
        success: true,
        message: `Upserted ${data?.length} news articles`,
        articles: data,
        count: data?.length
    };
}

app.post('/api/fetch-news', async (req, res) => {
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

const PORT = 3001;

// Check if running in standalone mode
if (process.argv.includes('--run-now')) {
    fetchNews()
        .then(() => {
            console.log('Fetch complete. Exiting.');
            process.exit(0);
        })
        .catch((err) => {
            console.error('Fetch failed:', err);
            process.exit(1);
        });
} else {
    app.listen(PORT, () => {
        console.log(`News fetcher server running on http://localhost:${PORT}`);
    });
}
