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
    const newsItems = [];

    for (const article of allArticles.slice(0, 20)) { // Process top 20 articles
      console.log(`Processing: ${article.title}`);

      try {
        // Use AI to evaluate importance and create a better summary
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `You are an AI news analyst. Analyze the given article and provide:
                1. A concise 2-sentence summary focusing on key information
                2. An importance score (1-10) where:
                   - 10: Major breakthrough (GPT-5 release, AGI milestone)
                   - 8-9: Significant development (new AI model, major funding)
                   - 6-7: Important update (feature launch, research paper)
                   - 4-5: Notable news (company news, minor updates)
                   - 1-3: Minor news
                3. Best fitting category: Technology, Research, Business, Ethics, or Products
                
                Only return news with score >= 7.
                
                Return JSON:
                {
                  "summary": "concise summary",
                  "importance": 8,
                  "category": "category",
                  "shouldPublish": true
                }`
              },
              {
                role: "user",
                content: `Title: ${article.title}\n\nDescription: ${article.description}\n\nAnalyze this article.`
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;

          if (content) {
            let cleanContent = content.trim();
            if (cleanContent.startsWith('```json')) {
              cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/```\s*$/, '');
            } else if (cleanContent.startsWith('```')) {
              cleanContent = cleanContent.replace(/^```\s*/, '').replace(/```\s*$/, '');
            }

            const analysis = JSON.parse(cleanContent);

            console.log(`Article: "${article.title}" - Score: ${analysis.importance}, Publish: ${analysis.shouldPublish}`);

            // Only publish if AI deems it important enough
            if (analysis.shouldPublish && analysis.importance >= 7) {
              // Use real image from RSS feed (temporarily disabled AI generation for performance)
              const imageUrl = article.imageUrl;

              newsItems.push({
                title: article.title,
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
          }
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
