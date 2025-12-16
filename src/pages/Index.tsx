import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchNewsArticles } from "@/services/newsService";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroCarousel } from "@/components/HeroCarousel";
import { FeatureCluster } from "@/components/FeatureCluster";
import { CategorySection } from "@/components/CategorySection";
import { TrendingSidebar } from "@/components/TrendingSidebar";
import { NewsletterCTA } from "@/components/NewsletterCTA";
import { SearchCustomEvent } from "@/lib/search";

const categoryTitles = ["AI Tools", "Robotics", "ML Research", "Generative Models", "Startup Pulse"];

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy] = useState("date");

  useEffect(() => {
    const handleSearch = (event: Event) => {
      const customEvent = event as SearchCustomEvent;
      setSearchQuery(customEvent.detail.query);
    };
    window.addEventListener("search", handleSearch);
    return () => window.removeEventListener("search", handleSearch);
  }, []);

  const { data: articles, isLoading, error } = useQuery({
    queryKey: ["news-articles", selectedCategory, searchQuery, sortBy],
    queryFn: () => fetchNewsArticles({ category: selectedCategory, searchQuery, sortBy }),
    refetchInterval: 30000,
  });

  const heroArticles = articles?.slice(0, 4) ?? [];
  const spotlightArticles = articles?.slice(4, 7) ?? [];
  const featureArticle = articles?.[7];
  const highlightArticles = articles?.slice(8, 11) ?? [];
  const remainingArticles = articles?.slice(11) ?? [];

  const categorySections = categoryTitles
    .map((title, index) => ({
      title,
      articles: remainingArticles.slice(index * 6, index * 6 + 6),
    }))
    .filter((section) => section.articles.length);

  const trendingArticles = articles?.slice(5, 15) ?? [];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Header />

      <main>
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-16 px-4 py-10 sm:px-6 lg:px-[120px] lg:py-16">
          {error && (
            <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-6 py-4 text-destructive shadow-sm">
              <p className="text-base font-semibold">Failed to load news articles</p>
              <p className="text-sm opacity-80">Please check your connection or try again later.</p>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-8">
              <Skeleton className="h-[580px] w-full rounded-[32px]" />
              <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <Skeleton className="h-[420px] rounded-[28px]" />
                <Skeleton className="h-[420px] rounded-[28px]" />
              </div>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, idx) => (
                  <Skeleton key={idx} className="h-[420px] rounded-[22px]" />
                ))}
              </div>
            </div>
          ) : articles && articles.length > 0 ? (
            <>
              <HeroCarousel heroArticles={heroArticles} spotlightArticles={spotlightArticles} />
              <FeatureCluster feature={featureArticle} highlights={highlightArticles} />

              <div className="grid gap-16 lg:grid-cols-[1fr_320px]">
                <div className="space-y-16">
                  {categorySections.map((section) => (
                    <CategorySection key={section.title} title={section.title} articles={section.articles} />
                  ))}
                </div>

                <div className="space-y-10">
                  <TrendingSidebar trending={trendingArticles} categories={categoryTitles} />
                  <NewsletterCTA />
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-border bg-white p-10 text-center shadow-sm">
              <p className="text-muted-foreground">No articles available yet.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
