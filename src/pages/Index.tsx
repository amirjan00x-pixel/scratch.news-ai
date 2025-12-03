import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchNewsArticles, NewsFilter } from "@/services/newsService";
import { Header } from "@/components/Header";
import { NewsCard } from "@/components/NewsCard";
import { CompactNewsCard } from "@/components/CompactNewsCard";
import { TrendingSection } from "@/components/TrendingSection";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { BreakingNewsTicker } from "@/components/BreakingNewsTicker";
import { CategoryNav } from "@/components/CategoryNav";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsImage } from "@/components/NewsImage";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");

  useEffect(() => {
    const handleSearch = (event: CustomEvent<NewsFilter>) => {
      setSearchQuery(event.detail.searchQuery);
      setSelectedCategory(event.detail.category === "all" ? "All" : event.detail.category);
      setSortBy(event.detail.sortBy);
    };
    window.addEventListener('search', handleSearch);
    return () => window.removeEventListener('search', handleSearch);
  }, []);

  const { data: articles, isLoading, error } = useQuery({
    queryKey: ['news-articles', selectedCategory, searchQuery, sortBy],
    queryFn: () => fetchNewsArticles({ category: selectedCategory, searchQuery, sortBy }),
    refetchInterval: 30000,
  });

  const featuredArticle = articles?.[0];
  const latestStories = articles?.slice(1, 9);
  const mustRead = articles?.slice(9, 15);
  const moreNews = articles?.slice(15, 21);
  const business = articles?.slice(21, 25);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <BreakingNewsTicker />
      <CategoryNav
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <main className="flex-grow">
        <div className="container mx-auto px-3 py-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-primary uppercase tracking-wide">
              BREAKING AI NEWS
            </h2>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md mb-6 text-center">
              <p className="font-bold">Failed to load news articles</p>
              <p className="text-sm opacity-80">Please check your internet connection or try again later.</p>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <div className="grid md:grid-cols-5 gap-3">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            </div>
          ) : articles && articles.length > 0 ? (
            <>
              {/* Three Column Layout */}
              <div className="grid lg:grid-cols-12 gap-4">
                {/* Left Column - Editor's Picks */}
                <div className="lg:col-span-3 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 bg-primary"></div>
                    <h2 className="text-sm font-bold text-foreground uppercase">Editor's Picks</h2>
                  </div>
                  {latestStories?.slice(0, 4).map((article, idx) => (
                    <div key={article.id}>
                      {idx === 0 ? (
                        <a
                          href={article.source_url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group"
                        >
                          <div className="relative h-40 rounded overflow-hidden mb-2">
                            <NewsImage
                              src={article.image_url || ""}
                              alt={article.title}
                              className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <span className="inline-block px-2 py-0.5 bg-primary text-white text-[9px] font-bold uppercase mb-1">
                                {article.category}
                              </span>
                              <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight">
                                {article.title}
                              </h3>
                            </div>
                          </div>
                        </a>
                      ) : (
                        <a
                          href={article.source_url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group pb-3 border-b border-border"
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-[9px] font-bold text-primary uppercase">{article.category}</span>
                            <span className="text-[9px] text-muted-foreground">• {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}</span>
                          </div>
                          <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {article.title}
                          </h3>
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                {/* Center Column - Main News */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 bg-primary"></div>
                    <h2 className="text-sm font-bold text-foreground uppercase">Main News</h2>
                  </div>

                  {/* Featured Large Article */}
                  {featuredArticle && (
                    <a
                      href={featuredArticle.source_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mb-4 group"
                    >
                      <div className="relative h-64 rounded overflow-hidden">
                        <NewsImage
                          src={featuredArticle.image_url || ""}
                          alt={featuredArticle.title}
                          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <span className="inline-block px-2 py-1 bg-primary text-white text-[10px] font-bold uppercase mb-2">
                            {featuredArticle.category}
                          </span>
                          <h2 className="text-xl font-bold mb-2 leading-tight text-white">
                            {featuredArticle.title}
                          </h2>
                          <div className="flex items-center gap-2 text-[10px] text-gray-300">
                            <span className="font-semibold">{featuredArticle.source}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(featuredArticle.published_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  )}

                  {/* Featured Posts Grid */}
                  <div>
                    <h3 className="text-xs font-bold text-foreground uppercase mb-3">Featured Posts</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {mustRead?.slice(0, 4).map((article) => (
                        <a
                          key={article.id}
                          href={article.source_url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group"
                        >
                          <div className="relative h-32 rounded overflow-hidden mb-2">
                            <NewsImage
                              src={article.image_url || ""}
                              alt={article.title}
                              className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-white text-[8px] font-bold uppercase">
                              {article.category}
                            </span>
                          </div>
                          <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                            {article.title}
                          </h3>
                          <div className="text-[9px] text-muted-foreground">
                            <span className="font-semibold text-primary">{article.source}</span> • {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Express Posts */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-3 bg-primary"></div>
                        <h3 className="text-xs font-bold text-foreground uppercase">Express Posts 1</h3>
                      </div>
                      <div className="space-y-3">
                        {business?.slice(0, 3).map((article) => (
                          <a
                            key={article.id}
                            href={article.source_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group"
                          >
                            <div className="flex gap-2">
                              <div className="w-20 h-16 flex-shrink-0 rounded overflow-hidden">
                                <NewsImage
                                  src={article.image_url || ""}
                                  alt={article.title}
                                  className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-bold text-primary uppercase block mb-0.5">
                                  {article.category}
                                </span>
                                <h4 className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                                  {article.title}
                                </h4>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-3 bg-primary"></div>
                        <h3 className="text-xs font-bold text-foreground uppercase">Express Posts 2</h3>
                      </div>
                      <div className="space-y-3">
                        {moreNews?.slice(0, 3).map((article) => (
                          <a
                            key={article.id}
                            href={article.source_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group"
                          >
                            <div className="flex gap-2">
                              <div className="w-20 h-16 flex-shrink-0 rounded overflow-hidden">
                                <NewsImage
                                  src={article.image_url || ""}
                                  alt={article.title}
                                  className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-bold text-primary uppercase block mb-0.5">
                                  {article.category}
                                </span>
                                <h4 className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                                  {article.title}
                                </h4>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Sidebar - Trending Now */}
                <aside className="lg:col-span-3 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 bg-primary"></div>
                    <h2 className="text-sm font-bold text-foreground uppercase">Trending Now</h2>
                  </div>
                  <div className="space-y-3">
                    {latestStories?.slice(4, 10).map((article, idx) => (
                      <a
                        key={article.id}
                        href={article.source_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex gap-2 group pb-3 border-b border-border last:border-0"
                      >
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                            {idx + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="w-full h-16 rounded overflow-hidden mb-2">
                            <NewsImage
                              src={article.image_url || ""}
                              alt={article.title}
                              className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                            {article.title}
                          </h3>
                        </div>
                      </a>
                    ))}
                  </div>

                  {/* Newsletter */}
                  <div className="bg-muted/30 border border-border rounded p-3 mt-4">
                    <h3 className="text-xs font-bold mb-2">Email Newsletter</h3>
                    <p className="text-[10px] text-muted-foreground mb-2">
                      Get AI news in your inbox
                    </p>
                    <div className="space-y-2">
                      <input
                        type="email"
                        placeholder="Email address"
                        className="w-full px-2 py-1.5 text-[10px] border border-input rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-[10px] h-7">
                        Submit
                      </Button>
                    </div>
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
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
