import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NewsCard } from "@/components/NewsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BreakingNewsTicker } from "@/components/BreakingNewsTicker";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ArticleCategory } from "@/constants/categories";

const WEEKLY_TOOLS_CATEGORY: ArticleCategory = "Technology";

const Weekly = () => {
  // Get top 10 news from the past week
  const { data: topNews, isLoading: newsLoading } = useQuery({
    queryKey: ["weekly-top-news"],
    queryFn: async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .gte("published_at", oneWeekAgo.toISOString())
        .order("importance_score", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Get top 5 tools from the past week
  const { data: topTools, isLoading: toolsLoading } = useQuery({
    queryKey: ["weekly-top-tools"],
    queryFn: async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .eq("category", WEEKLY_TOOLS_CATEGORY)
        .gte("published_at", oneWeekAgo.toISOString())
        .order("importance_score", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  // Get the most important article for special analysis
  const { data: specialAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: ["weekly-special-analysis"],
    queryFn: async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .gte("published_at", oneWeekAgo.toISOString())
        .order("importance_score", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const isLoading = newsLoading || toolsLoading || analysisLoading;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <BreakingNewsTicker />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-1">Weekly Top 10</h1>
            <p className="text-sm text-muted-foreground">Top 10 news stories + 5 important tools + 1 special analysis</p>
          </div>

          {/* Special Analysis Section */}
          {specialAnalysis && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-accent text-accent-foreground">Special Analysis</Badge>
                <h2 className="text-xl font-bold text-foreground">Most Important Story This Week</h2>
              </div>
              <NewsCard
                id={specialAnalysis.id}
                title={specialAnalysis.title}
                summary={specialAnalysis.summary}
                category={specialAnalysis.category}
                timeAgo={formatDistanceToNow(new Date(specialAnalysis.published_at), { addSuffix: true })}
                image={specialAnalysis.image_url || "/placeholder.svg"}
                source={specialAnalysis.source}
                sourceUrl={specialAnalysis.source_url}
              />
            </div>
          )}

          {/* Top 10 News Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-primary text-primary-foreground">Top 10</Badge>
              <h2 className="text-xl font-bold text-foreground">Best News Stories</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <>
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-48" />
                  ))}
                </>
              ) : topNews && topNews.length > 0 ? (
                topNews.map((article, index) => (
                  <div key={article.id} className="relative">
                    <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10">
                      {index + 1}
                    </div>
                    <NewsCard
                      id={article.id}
                      title={article.title}
                      summary={article.summary}
                      category={article.category}
                      timeAgo={formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                      image={article.image_url || "/placeholder.svg"}
                      source={article.source}
                      sourceUrl={article.source_url}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No news found this week
                </div>
              )}
            </div>
          </div>

          {/* Top 5 Tools Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-secondary text-secondary-foreground">Top 5</Badge>
              <h2 className="text-xl font-bold text-foreground">Important AI Tools</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-48" />
                  ))}
                </>
              ) : topTools && topTools.length > 0 ? (
                topTools.map((tool, index) => (
                  <div key={tool.id} className="relative">
                    <div className="absolute -top-2 -left-2 bg-secondary text-secondary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10">
                      {index + 1}
                    </div>
                    <NewsCard
                      id={tool.id}
                      title={tool.title}
                      summary={tool.summary}
                      category={tool.category}
                      timeAgo={formatDistanceToNow(new Date(tool.published_at), { addSuffix: true })}
                      image={tool.image_url || "/placeholder.svg"}
                      source={tool.source}
                      sourceUrl={tool.source_url}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No tools found this week
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Weekly;
