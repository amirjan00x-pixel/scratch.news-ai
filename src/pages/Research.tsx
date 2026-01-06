import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { NewsCard } from "@/components/NewsCard";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { BreakingNewsTicker } from "@/components/BreakingNewsTicker";
import { formatDistanceToNow } from "date-fns";
import { ArticleCategory } from "@/constants/categories";

const RESEARCH_CATEGORY: ArticleCategory = "Research";

const Research = () => {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['research-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('category', RESEARCH_CATEGORY)
        .order('published_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <BreakingNewsTicker />

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">AI Research</h1>
            <p className="text-muted-foreground">Latest papers, university innovations, and research breakthroughs</p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {articles.map((article) => (
                <NewsCard
                  key={article.id}
                  id={article.id}
                  title={article.title}
                  summary={article.summary}
                  category={article.category}
                  timeAgo={formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                  image={article.image_url || "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600"}
                  source={article.source}
                  sourceUrl={article.source_url}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No articles found in this category.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Research;
