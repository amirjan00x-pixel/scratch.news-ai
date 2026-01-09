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
import { TrendingSidebar } from "@/components/TrendingSidebar";
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

    // ==== HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS ====

    // Bookmark state (must be declared before any returns)
    const [isBookmarked, setIsBookmarked] = useState(false);

    // Initialize bookmark state from localStorage
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

    // Toggle bookmark handler
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

    // Related News Query - Fetch news from the same category
    const { data: relatedNews } = useQuery({
        queryKey: ['related-news', article?.category, id],
        queryFn: async () => {
            // First try to get news from the same category
            const { data: categoryNews } = await supabase
                .from('news_articles')
                .select('*')
                .eq('category', article?.category || '')
                .neq('id', id) // Exclude current article
                .order('published_at', { ascending: false })
                .limit(10);

            // If we have related news in the same category, return them
            if (categoryNews && categoryNews.length >= 3) {
                return categoryNews as Article[];
            }

            // Fallback: If not enough related articles, get latest trending
            const { data: fallbackNews } = await supabase
                .from('news_articles')
                .select('*')
                .neq('id', id) // Exclude current article
                .order('published_at', { ascending: false })
                .limit(10);

            return (fallbackNews as Article[]) || [];
        },
        enabled: !!article && !!id, // Only run when article is loaded
    });

    // ============ LOADING STATE ============
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[hsl(var(--background))]">
                <Helmet>
                    <title>Loading... | {SITE_NAME}</title>
                </Helmet>
                <Header />
                <main className="container max-w-4xl py-12 px-4">
                    {/* Back button skeleton */}
                    <Skeleton className="h-10 w-36 mb-8 rounded-full" />

                    {/* Category badge skeleton */}
                    <div className="flex gap-2 mb-6">
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>

                    {/* Title skeleton */}
                    <Skeleton className="h-12 w-full mb-3" />
                    <Skeleton className="h-12 w-3/4 mb-6" />

                    {/* Meta info skeleton */}
                    <div className="flex gap-6 mb-8 pb-8 border-b border-border">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-28" />
                    </div>

                    {/* Featured image skeleton */}
                    <Skeleton className="aspect-video w-full rounded-2xl mb-10" />

                    {/* Content skeleton */}
                    <div className="space-y-4">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-11/12" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-4/5" />
                    </div>

                    {/* Animated loading indicator */}
                    <div className="flex items-center justify-center gap-3 mt-12 text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span className="text-sm">Loading article...</span>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // ============ ERROR / NOT FOUND STATE ============
    if (error || !article) {
        const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('network');

        return (
            <div className="min-h-screen bg-[hsl(var(--background))]">
                <Helmet>
                    <title>Article Not Found | {SITE_NAME}</title>
                </Helmet>
                <Header />
                <main className="container max-w-2xl py-16 px-4">
                    <div className="text-center space-y-6">
                        {/* Error Icon */}
                        <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                            {isNetworkError ? (
                                <AlertCircle className="h-10 w-10 text-destructive" />
                            ) : (
                                <FileQuestion className="h-10 w-10 text-muted-foreground" />
                            )}
                        </div>

                        {/* Error Title */}
                        <h1 className="text-3xl font-bold text-foreground">
                            {isNetworkError ? "Connection Error" : "Article Not Found"}
                        </h1>

                        {/* Error Description */}
                        <p className="text-muted-foreground max-w-md mx-auto">
                            {isNetworkError
                                ? "We couldn't connect to the server. Please check your internet connection and try again."
                                : "Sorry, the article you're looking for doesn't exist or may have been removed."
                            }
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            {isNetworkError && (
                                <Button
                                    onClick={() => refetch()}
                                    disabled={isRefetching}
                                    className="gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                                    {isRefetching ? 'Retrying...' : 'Try Again'}
                                </Button>
                            )}
                            <Button asChild variant={isNetworkError ? "outline" : "default"}>
                                <Link to="/">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Home
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Suggestions */}
                    {relatedNews && relatedNews.length > 0 && (
                        <div className="mt-16 pt-12 border-t border-border">
                            <h2 className="text-xl font-bold mb-6 text-center">Browse Latest News</h2>
                            <TrendingSidebar trending={relatedNews.slice(0, 5)} categories={[]} />
                        </div>
                    )}
                </main>
                <Footer />
            </div>
        );
    }

    // Content Logic: Use content if available, fallback to summary
    const rawContent = article?.content || article?.summary || "Content unavailable. Please read the full article on the source website.";
    const isShortContent = (rawContent?.length || 0) < 300;

    // Calculate reading time (safe with null check)
    const readingTime = calculateReadingTime(rawContent);

    // SEO: Prepare meta content
    const pageTitle = `${article?.title || 'Article'} | ${SITE_NAME}`;
    const ogImage = article?.image_url || DEFAULT_OG_IMAGE;
    const ogDescription = article?.summary?.substring(0, 200) || "Read the latest AI news on AI Nexus.";

    return (
        <div className="min-h-screen bg-[hsl(var(--background))]">
            {/* Dynamic SEO Meta Tags */}
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={ogDescription} />
                {/* Open Graph */}
                <meta property="og:type" content="article" />
                <meta property="og:title" content={article.title} />
                <meta property="og:description" content={ogDescription} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:url" content={currentUrl} />
                <meta property="og:site_name" content={SITE_NAME} />
                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={article.title} />
                <meta name="twitter:description" content={ogDescription} />
                <meta name="twitter:image" content={ogImage} />
                {/* Canonical URL */}
                <link rel="canonical" href={currentUrl} />
            </Helmet>

            <Header />

            <main className="container max-w-4xl py-6 md:py-10 px-4">
                {/* Breadcrumb Navigation */}
                <nav className="flex items-center text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
                    <Link to="/" className="hover:text-primary transition-colors">
                        Home
                    </Link>
                    <span className="mx-2 text-border">/</span>
                    <Link
                        to={`/?category=${encodeURIComponent(article.category)}`}
                        className="capitalize hover:text-primary transition-colors"
                    >
                        {article.category}
                    </Link>
                    <span className="mx-2 text-border">/</span>
                    <span className="truncate max-w-[180px] sm:max-w-xs md:max-w-md text-foreground font-medium">
                        {article.title}
                    </span>
                </nav>

                {/* Back Button (Mobile-friendly alternative) */}
                <Button asChild variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-primary">
                    <Link to="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to News
                    </Link>
                </Button>

                <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
                    {/* Main Content Column with entrance animation */}
                    <article className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Header Section */}
                        <header className="space-y-6">
                            <div className="flex flex-wrap gap-2 items-center">
                                <Badge variant="secondary" className="text-xs font-semibold px-3 py-1 uppercase tracking-wider">
                                    {article.category}
                                </Badge>
                                {article.is_featured && (
                                    <Badge variant="default" className="text-xs font-semibold px-3 py-1 uppercase tracking-wider bg-gradient-to-r from-primary to-primary/80">
                                        ✨ Featured
                                    </Badge>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-[1.15] tracking-tight text-foreground/95 dark:text-foreground/90">
                                {article.title}
                            </h1>

                            {/* Metadata - refined styling */}
                            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-muted-foreground/80 border-b border-border/60 pb-6">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                                    <span className="text-muted-foreground">{format(new Date(article.published_at), "MMMM d, yyyy")}</span>
                                </div>
                                {article.source && (
                                    <div className="flex items-center gap-1.5">
                                        <User className="h-3.5 w-3.5 text-muted-foreground/60" />
                                        <span className="font-medium text-foreground/80">{article.source}</span>
                                    </div>
                                )}
                                {/* Reading Time */}
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                                    <span className="text-muted-foreground">{readingTime} min read</span>
                                </div>
                                {/* Share & Bookmark Buttons */}
                                <div className="ml-auto flex items-center gap-2">
                                    <button
                                        onClick={toggleBookmark}
                                        className={`p-2 rounded-full transition-all duration-200 ${isBookmarked
                                            ? 'bg-primary/10 text-primary'
                                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                            }`}
                                        aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                                    >
                                        <Bookmark
                                            className={`h-4 w-4 transition-all ${isBookmarked ? 'fill-primary' : ''}`}
                                        />
                                    </button>
                                    <ShareButtons title={article.title} url={currentUrl} />
                                </div>
                            </div>
                        </header>

                        {/* Featured Image - Enhanced with shadow and rounded corners */}
                        <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border/50 bg-muted shadow-xl shadow-black/5 dark:shadow-black/20 transition-shadow duration-300 hover:shadow-2xl hover:shadow-black/10">
                            <NewsImage
                                src={article.image_url || ""}
                                alt={article.title}
                                className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                            />
                        </div>

                        {/* Content - Improved typography with structural parsing */}
                        <div className="space-y-6 md:space-y-8">
                            {(() => {
                                const lines = rawContent.split('\n').filter(l => l.trim());
                                const elements = [];
                                let insideWim = false;
                                let wimBuffer: string[] = [];

                                for (let i = 0; i < lines.length; i++) {
                                    const line = lines[i].trim();

                                    // Filter out unwanted "Key Points", "Highlights" or bullet-style headers
                                    const lowerLine = line.toLowerCase();
                                    if (
                                        lowerLine.includes('key points') ||
                                        lowerLine.includes('highlights') ||
                                        lowerLine === 'key takeaways' ||
                                        (line.startsWith('-') && line.length < 50) // Skip short bullet lines that look like list items
                                    ) {
                                        continue;
                                    }

                                    // Detect start of Why It Matters
                                    if (lowerLine.startsWith('### why it matters') || lowerLine.startsWith('## why it matters')) {
                                        insideWim = true;
                                        continue;
                                    }

                                    if (insideWim) {
                                        wimBuffer.push(line.replace(/^-\s*/, '')); // Clean bullet from WIM if present
                                        continue;
                                    }

                                    // Handle regular headers
                                    if (line.startsWith('##')) {
                                        elements.push(
                                            <h2 key={i} className="mt-12 mb-6 text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                                                {line.replace(/^#+\s*/, '')}
                                            </h2>
                                        );
                                        continue;
                                    }

                                    // Handle normal paragraphs (convert leftover bullets to text)
                                    const cleanParagraph = line.replace(/^-\s*/, '');
                                    const isFirstParagraph = elements.length === 0;
                                    elements.push(
                                        <p
                                            key={i}
                                            className={`text-xl leading-relaxed text-foreground/90 dark:text-foreground/80 font-serif antialiased mb-8 ${isFirstParagraph ? 'first-letter:text-6xl first-letter:font-bold first-letter:text-primary first-letter:float-left first-letter:mr-4 first-letter:mt-2' : ''}`}
                                        >
                                            {cleanParagraph}
                                        </p>
                                    );
                                }

                                // Append Why It Matters at the end
                                if (wimBuffer.length > 0) {
                                    elements.push(
                                        <div key="wim-block" className="my-16 rounded-3xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-900/20 p-8 md:p-12 shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <Sparkles className="h-24 w-24 text-indigo-600" />
                                            </div>
                                            <h3 className="mb-6 flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-indigo-700 to-primary bg-clip-text text-transparent dark:from-indigo-400 dark:to-primary">
                                                <Sparkles className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                                                Strategic Analysis: Why it Matters
                                            </h3>
                                            <div className="space-y-6 relative z-10">
                                                {wimBuffer.map((line, idx) => (
                                                    <p key={idx} className="text-xl leading-relaxed text-slate-800 dark:text-slate-300 font-medium">
                                                        {line}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }

                                return elements;
                            })()}
                        </div>

                        {/* Render "Why it matters" specially if it wasn't caught in the loop properly (e.g. if we want to ensure it's a box)
                            The previous loop is a bit naive for block-level wrapping. 
                            Let's try a simpler approach since we control the prompt.
                            So we can check for that.
                        */}


                        {/* Minimal Source Link */}
                        <div className="mt-12 flex justify-end">
                            <Button variant="outline" size="sm" asChild className="rounded-full border-border/50 bg-transparent text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary transition-all">
                                <a
                                    href={article.source_url || "#"}
                                    target="_blank"
                                    rel="nofollow noopener noreferrer"
                                    className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold"
                                >
                                    Source: {article.source}
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </Button>
                        </div>
                    </article>

                    {/* Sidebar Column */}
                    <aside className="hidden lg:block space-y-8">
                        {relatedNews && relatedNews.length > 0 && (
                            <TrendingSidebar
                                trending={relatedNews}
                                categories={[]}
                                title={`Related in ${article.category}`}
                                showMustWatch={false}
                            />
                        )}
                    </aside>
                </div>

                {/* Mobile Sidebar (Visible below content on small screens) */}
                <div className="lg:hidden mt-10 border-t pt-8">
                    <h3 className="text-2xl font-bold mb-6">Related in {article.category}</h3>
                    {relatedNews && relatedNews.length > 0 && (
                        <TrendingSidebar
                            trending={relatedNews}
                            categories={[]}
                            title={`More in ${article.category}`}
                            showMustWatch={false}
                        />
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default NewsDetailPage;
