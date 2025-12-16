import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Real RSS feeds from trusted AI news sources
const RSS_FEEDS = [
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
    name: "MIT Technology Review",
    url: "https://www.technologyreview.com/topic/artificial-intelligence/feed",
    category: "Research"
  },
  {
    name: "Ars Technica AI",
    url: "https://arstechnica.com/tag/artificial-intelligence/feed/",
    category: "Technology"
  },
  {
    name: "AI News",
    url: "https://www.artificialintelligence-news.com/feed/",
    category: "Technology"
  },
];

interface RSSArticle {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  category: string;
  imageUrl?: string;
}

async function parseRSSFeed(feedUrl: string, sourceName: string, category: string): Promise<RSSArticle[]> {
  try {
    console.log(`Fetching RSS feed from ${sourceName}...`);
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-News-Aggregator/1.0)'
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${sourceName}: ${response.status}`);
      return [];
    }

    const xml = await response.text();

    // Validate XML size to prevent DoS
    if (xml.length > 5000000) { // 5MB limit
      console.error(`RSS feed from ${sourceName} too large`);
      return [];
    }

    // Simple regex-based XML parsing with validation
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
    const imageRegex = /<media:content[^>]+url=["'](.*?)["'][^>]*>|<enclosure[^>]+url=["'](.*?)["'][^>]*type=["']image\/[^"']*["'][^>]*>|<media:thumbnail[^>]+url=["'](.*?)["'][^>]*>/;

    // Sanitize function to remove dangerous characters
    const sanitize = (str: string): string => {
      return str
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim()
        .substring(0, 1000); // Limit length
    };

    const articles: RSSArticle[] = [];
    const items = xml.match(itemRegex) || [];

    for (const itemXml of items) {
      const titleMatch = itemXml.match(titleRegex);
      const linkMatch = itemXml.match(linkRegex);
      const descMatch = itemXml.match(descRegex);
      const pubDateMatch = itemXml.match(pubDateRegex);
      const imageMatch = itemXml.match(imageRegex);

      const title = sanitize(titleMatch?.[1] || titleMatch?.[2] || "");
      const link = (linkMatch?.[1] || "").trim();
      const imageUrl = (imageMatch?.[1] || imageMatch?.[2] || imageMatch?.[3] || "").trim();

      // Validate URL format
      const isValidUrl = link.match(/^https?:\/\/.+/i);
      const isValidImage = imageUrl && imageUrl.match(/^https?:\/\/.+/i);

      if (title && link && isValidUrl) {
        const description = sanitize(
          (descMatch?.[1] || descMatch?.[2] || "")
            .replace(/<[^>]*>/g, '')
            .replace(/&[^;]+;/g, '')
        );

        articles.push({
          title: title.substring(0, 200),
          link: link.substring(0, 500),
          description: description.substring(0, 300),
          pubDate: (pubDateMatch?.[1] || new Date().toISOString()).trim(),
          source: sourceName,
          category: category,
          imageUrl: isValidImage ? imageUrl.substring(0, 500) : undefined
        });
      }
    }

    console.log(`Found ${articles.length} articles from ${sourceName}`);
    return articles.slice(0, 5); // Take top 5 from each source
  } catch (error) {
    console.error(`Error parsing RSS from ${sourceName}:`, error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Starting real AI news aggregation from RSS feeds...");

    // Fetch articles from all RSS feeds
    const allArticles: RSSArticle[] = [];
    for (const feed of RSS_FEEDS) {
      const articles = await parseRSSFeed(feed.url, feed.name, feed.category);
      allArticles.push(...articles);
    }

    console.log(`Total articles fetched: ${allArticles.length}`);

    if (allArticles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No articles found from RSS feeds" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process each article with AI for summarization and importance evaluation
    const OPENROUTER_MODEL = "nvidia/nemotron-3-nano-30b-a3b:free";
    const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";
    const SITE_URL = Deno.env.get("OPENROUTER_SITE_URL") ?? "https://github.com/new20/scratch.news-ai";
    const APP_NAME = Deno.env.get("OPENROUTER_APP_NAME") ?? "scratch.news-ai";

    const callOpenRouter = async (messages: { role: string; content: string }[]) => {
      if (!OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY is missing");
      }

      const response = await fetch(OPENROUTER_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": SITE_URL,
          "X-Title": APP_NAME,
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages,
          max_tokens: 400,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`OpenRouter failed (${response.status}): ${body}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error("OpenRouter response missing content");
      return content.trim();
    };

    const parseEditorialJson = (text: string) => {
      let clean = text.trim();
      if (clean.startsWith("```")) {
        clean = clean.replace(/^```[a-zA-Z]*\s*/g, "").replace(/```$/g, "").trim();
      }
      return JSON.parse(clean);
    };

    const newsItems = [];

    for (const article of allArticles.slice(0, 20)) { // Process top 20 articles
      console.log(`Processing: ${article.title}`);

      try {
        const aiText = await callOpenRouter([
          {
            role: "system",
            content: `You are an AI news analyst. For each article, return a strict JSON object with:
{
  "summary": "2-3 sentence concise summary",
  "importance": <number 1-10>,
  "category": "Technology|Research|Business",
  "shouldPublish": true|false,
  "headline": "engaging headline",
  "tags": ["tag1","tag2","tag3"]
}
Only publish if importance >= 7. Do not include code fences.`,
          },
          {
            role: "user",
            content: `Title: ${article.title}\nDescription: ${article.description}\nSource: ${article.source}\nCategory hint: ${article.category}`,
          },
        ]);

        const analysis = parseEditorialJson(aiText);

        console.log(`Article: "${article.title}" - Score: ${analysis.importance}, Publish: ${analysis.shouldPublish}`);

        if (analysis.shouldPublish && analysis.importance >= 7) {
          const imageUrl = article.imageUrl;

          newsItems.push({
            title: analysis.headline || article.title,
            summary: analysis.summary || article.description.substring(0, 200),
            category: analysis.category || article.category,
            source: article.source,
            source_url: article.link,
            image_url: imageUrl || `https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop`,
            importance_score: analysis.importance,
            is_featured: analysis.importance >= 9,
            published_at: new Date(article.pubDate).toISOString(),
          });
        }
      } catch (error) {
        console.error(`Error processing article: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Insert news items into database
    if (newsItems.length > 0) {
      const { data, error } = await supabase
        .from("news_articles")
        .insert(newsItems)
        .select();

      if (error) {
        console.error("Error inserting news:", error);
        throw error;
      }

      console.log(`Successfully added ${data?.length} news articles`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Added ${data?.length} news articles`,
          articles: data
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "No new articles to add" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in aggregate-ai-news:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
