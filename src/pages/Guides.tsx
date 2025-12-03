import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CompactNewsCard } from "@/components/CompactNewsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BreakingNewsTicker } from "@/components/BreakingNewsTicker";
import { formatDistanceToNow } from "date-fns";

const Guides = () => {
  const { data: articles, isLoading } = useQuery({
    queryKey: ["guides-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .or("category.ilike.%guide%,category.ilike.%tutorial%,category.ilike.%education%")
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <BreakingNewsTicker />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-1">Guides & Tutorials</h1>
            <p className="text-sm text-muted-foreground">Learn how to use AI tools, work with models, and understand career impacts</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <>
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </>
            ) : articles && articles.length > 0 ? (
              articles.map((article) => (
                <CompactNewsCard
                  key={article.id}
                  title={article.title}
                  category={article.category}
                  timeAgo={formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                  image={article.image_url || "/placeholder.svg"}
                  sourceUrl={article.source_url}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No guides found
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Guides;
