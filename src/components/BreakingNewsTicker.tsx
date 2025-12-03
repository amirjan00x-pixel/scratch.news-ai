import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";

export const BreakingNewsTicker = () => {
  const { data: breakingNews } = useQuery({
    queryKey: ["breaking-news"],
    queryFn: async () => {
      const { data } = await supabase
        .from("news_articles")
        .select("id, title, published_at")
        .gte("importance_score", 8)
        .order("published_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (!breakingNews || breakingNews.length === 0) return null;

  return (
    <div className="bg-primary text-primary-foreground overflow-hidden">
      <div className="container mx-auto px-4 py-2 flex items-center gap-4">
        <div className="flex items-center gap-2 font-bold text-sm whitespace-nowrap">
          <AlertCircle className="h-4 w-4" />
          BREAKING
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="animate-scroll flex gap-8">
            {breakingNews.map((news) => (
              <span key={news.id} className="text-sm whitespace-nowrap">
                {news.title}
              </span>
            ))}
            {breakingNews.map((news) => (
              <span key={`${news.id}-duplicate`} className="text-sm whitespace-nowrap">
                {news.title}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
