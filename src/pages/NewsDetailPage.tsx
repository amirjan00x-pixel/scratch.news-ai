import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink, Calendar, User, AlertCircle, RefreshCw, FileQuestion, Clock, Bookmark, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { NewsImage } from "@/components/NewsImage";
import { Article } from "@/services/newsService";
import { Helmet } from "react-helmet-async";
import { ShareButtons } from "@/components/ShareButtons";
import { toast } from "sonner";

// Constants
const SITE_NAME = "AI Nexus";
const DEFAULT_OG_IMAGE = "/og-default.png";
const BOOKMARKS_KEY = "ai-nexus-bookmarks";

// Helper: Calculate reading time (with null safety)
const calculateReadingTime = (text: string | null | undefined): number => {
    if (!text || typeof text !== 'string') return 1; // Default 1 minute
    const wordsPerMinute = 200;
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return Math.max(1, minutes); // Minimum 1 minute
};

// Helper: Get bookmarks from localStorage (with error handling)
const getBookmarks = (): string[] => {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(BOOKMARKS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.warn('Failed to read bookmarks from localStorage:', e);
        return [];
    }
};

// Helper: Save bookmarks to localStorage (with error handling)
const saveBookmarks = (bookmarks: string[]): boolean => {
    if (typeof window === "undefined") return false;
    try {
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
        return true;
    } catch (e) {
        console.warn('Failed to save bookmarks to localStorage:', e);
        return false;
    }
};

const NewsDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();

    // Bookmark state
    const [isBookmarked, setIsBookmarked] = useState(false);

    useEffect(() => {
        if (id) {
            try {
                const bookmarks = getBookmarks();
                setIsBookmarked(bookmarks.includes(id));
            } catch (e) {
                console.warn('Failed to check bookmark status:', e);
            }
        }
    }, [id]);

    const toggleBookmark = useCallback(() => {
        if (!id) return;
        try {
            const bookmarks = getBookmarks();
            const isCurrentlyBookmarked = bookmarks.includes(id);
            if (isCurrentlyBookmarked) {
                const newBookmarks = bookmarks.filter(b => b !== id);
                if (saveBookmarks(newBookmarks)) {
                    setIsBookmarked(false);
                    toast.success("Removed from bookmarks");
                }
            } else {
                const newBookmarks = [...bookmarks, id];
                if (saveBookmarks(newBookmarks)) {
                    setIsBookmarked(true);
                    toast.success("Added to bookmarks");
                }
            }
        } catch (e) {
            console.warn('Failed to toggle bookmark:', e);
            toast.error("Failed to save bookmark");
        }
    }, [id]);

    const currentUrl = typeof window !== "undefined"
        ? `${window.location.origin}${location.pathname}`
        : "";

    // Main Article Query
    const { data: article, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ['news-article', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('news_articles')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return data as Article & { content?: string };
        },
        enabled: !!id,
        retry: 1,
    });

    // Related News Query
    const { data: relatedNews } = useQuery({
        queryKey: ['related-news', article?.category, id],
        queryFn: async () => {
            const { data: categoryNews } = await supabase
                .from('news_articles')
                .select('*')
                .eq('category', article?.category || '')
                .neq('id', id)
                .order('published_at', { ascending: false })
                .limit(5);
            return categoryNews as Article[];
        },
        enabled: !!article && !!id,
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="max-w-3xl mx-auto px-6 pt-20">
                    <Skeleton className="h-10 w-36 mb-12 rounded-full" />
                    <div className="flex gap-4 mb-8">
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-6 w-32 rounded-full" />
                    </div>
                    <Skeleton className="h-20 w-full mb-4" />
                    <Skeleton className="h-20 w-3/4 mb-16" />
                    <Skeleton className="aspect-[21/10] w-full rounded-[2rem] mb-20" />
                    <div className="space-y-6">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-4/5" />
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="min-h-screen bg-background text-center flex flex-col items-center justify-center p-6">
                <AlertCircle className="h-16 w-16 text-destructive mb-4" />
                <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
                <Button asChild><Link to="/">Return Home</Link></Button>
            </div>
        );
    }

    const rawContent = article.summary || "";
    const readingTime = calculateReadingTime(rawContent);
    const ogImage = article.image_url || DEFAULT_OG_IMAGE;
    const ogDescription = rawContent.slice(0, 160) + "...";

    return (
        <div className="min-h-screen bg-background scroll-smooth">
            <Helmet>
                <title>{article.title} | {SITE_NAME}</title>
                <meta name="description" content={ogDescription} />
                <meta property="og:title" content={article.title} />
                <meta property="og:description" content={ogDescription} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:type" content="article" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={article.title} />
                <meta name="twitter:description" content={ogDescription} />
                <meta name="twitter:image" content={ogImage} />
                <link rel="canonical" href={currentUrl} />
            </Helmet>

            <Header />

            <main className="min-h-screen bg-background">
                {/* Minimal Header Space */}
                <div className="max-w-3xl mx-auto px-6 pt-20 pb-12 text-center md:text-left">
                    <Button asChild variant="ghost" className="mb-12 -ml-4 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors">
                        <Link to="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Feed
                        </Link>
                    </Button>

                    <header className="space-y-8 mb-16">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <Badge variant="outline" className="rounded-full px-4 py-1 text-[10px] uppercase tracking-[0.2em] font-bold border-primary/20 bg-primary/5 text-primary">
                                {article.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground/60 font-medium tracking-wider">
                                {format(new Date(article.published_at), "MMMM d, yyyy")}
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight text-foreground antialiased text-balance">
                            {article.title}
                        </h1>

                        <div className="flex items-center justify-center md:justify-start gap-4 pt-4 border-t border-border/40">
                            {article.source && (
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center font-bold text-primary border border-primary/10">
                                        {article.source.charAt(0)}
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-sm font-bold text-foreground leading-none mb-1">{article.source}</span>
                                        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tighter">{readingTime} MIN READ</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </header>
                </div>

                {/* Full Width Image Container */}
                <div className="max-w-5xl mx-auto px-4 mb-20">
                    <div className="relative aspect-[21/10] w-full overflow-hidden rounded-[2rem] shadow-2xl shadow-primary/5">
                        <NewsImage
                            src={article.image_url || ""}
                            alt={article.title}
                            className="h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
                        />
                    </div>
                </div>

                {/* Article Core Content */}
                <article className="max-w-3xl mx-auto px-6 pb-24">
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        {(() => {
                            const lines = rawContent.split('\n').filter(l => l.trim());
                            const elements = [];
                            let insideWim = false;
                            let wimBuffer: string[] = [];

                            for (let i = 0; i < lines.length; i++) {
                                const line = lines[i].trim();
                                const lowerLine = line.toLowerCase();

                                // Strict removals of analytical boxes/summaries as requested
                                if (
                                    lowerLine.includes('key points') ||
                                    lowerLine.includes('highlights') ||
                                    lowerLine === 'key takeaways' ||
                                    lowerLine.includes('atomic facts') ||
                                    lowerLine.includes('strategic analysis') ||
                                    lowerLine.includes('contextual link') ||
                                    lowerLine.includes('reasoning layer') ||
                                    (line.startsWith('-') && line.length < 60)
                                ) {
                                    continue;
                                }

                                if (lowerLine.startsWith('### why it matters') || lowerLine.startsWith('## why it matters')) {
                                    insideWim = true;
                                    continue;
                                }

                                if (insideWim) {
                                    wimBuffer.push(line.replace(/^-\s*/, ''));
                                    continue;
                                }

                                if (line.startsWith('##')) {
                                    elements.push(
                                        <h2 key={i} className="text-3xl font-bold mt-16 mb-8 text-foreground tracking-tight">
                                            {line.replace(/^#+\s*/, '')}
                                        </h2>
                                    );
                                    continue;
                                }

                                const cleanParagraph = line.replace(/^-\s*/, '');
                                const isFirstParagraph = elements.length === 0;

                                elements.push(
                                    <p
                                        key={i}
                                        className={`font-serif text-[22px] leading-[1.85] text-foreground/90 dark:text-foreground/80 mb-10 antialiased ${isFirstParagraph ? 'first-letter:text-7xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:leading-none first-letter:text-primary mt-4' : ''}`}
                                    >
                                        {cleanParagraph}
                                    </p>
                                );
                            }

                            // Elegant Blockquote for Why it Matters
                            if (wimBuffer.length > 0) {
                                elements.push(
                                    <div key="wim-quote" className="my-20 pl-10 border-l-[3px] border-primary/40 relative group">
                                        <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-primary" />
                                        <div className="space-y-6">
                                            {wimBuffer.map((line, idx) => (
                                                <p key={idx} className="font-serif italic text-2xl md:text-3xl text-foreground/70 leading-relaxed font-light transition-colors group-hover:text-foreground">
                                                    {line}
                                                </p>
                                            ))}
                                        </div>
                                        <div className="mt-8 flex items-center gap-2 text-primary font-bold tracking-widest text-[10px] uppercase opacity-60">
                                            <Sparkles className="h-3 w-3" />
                                            Editorial Significance
                                        </div>
                                    </div>
                                );
                            }

                            return elements;
                        })()}
                    </div>

                    {/* Footer Actions */}
                    <footer className="mt-24 pt-12 border-t border-border/40">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={toggleBookmark}
                                    className={`p-3 rounded-full transition-all border ${isBookmarked
                                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                        : 'bg-transparent border-border hover:border-primary text-muted-foreground hover:text-primary'
                                        }`}
                                >
                                    <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                                </button>
                                <ShareButtons title={article.title} url={currentUrl} />
                            </div>

                            <Button variant="ghost" asChild className="group text-muted-foreground hover:text-primary">
                                <a href={article.source_url || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                                    Original Coverage
                                    <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </a>
                            </Button>
                        </div>
                    </footer>
                </article>

                {/* Simple Related Content (Minimal) */}
                <section className="bg-muted/30 py-24 border-t border-border/40">
                    <div className="max-w-3xl mx-auto px-6">
                        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground mb-12">Keep Reading</h3>
                        <div className="grid gap-16">
                            {relatedNews?.slice(0, 3).map((item) => (
                                <Link key={item.id} to={`/news/${item.id}`} className="group block space-y-4">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{item.category}</span>
                                    <h4 className="text-3xl md:text-4xl font-bold group-hover:text-primary transition-colors leading-tight">
                                        {item.title}
                                    </h4>
                                    <p className="text-muted-foreground line-clamp-2 font-serif text-lg leading-relaxed max-w-2xl">
                                        {item.summary.split('\n')[0].replace(/^#+\s*/, '')}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default NewsDetailPage;
