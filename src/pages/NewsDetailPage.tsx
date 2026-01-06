import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink, Calendar, User, AlertCircle, RefreshCw, FileQuestion } from "lucide-react";
import { format } from "date-fns";
import { NewsImage } from "@/components/NewsImage";
import { Article } from "@/services/newsService";
import { TrendingSidebar } from "@/components/TrendingSidebar";
import { Helmet } from "react-helmet-async";
import { ShareButtons } from "@/components/ShareButtons";

// Constants
const SITE_NAME = "AI Nexus";
const DEFAULT_OG_IMAGE = "/og-default.png";

const NewsDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();

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
        retry: 1, // Only retry once on failure
    });

    // Related News Query
    const { data: relatedNews } = useQuery({
        queryKey: ['related-news'],
        queryFn: async () => {
            const { data } = await supabase
                .from('news_articles')
                .select('*')
                .order('published_at', { ascending: false })
                .limit(10);
            return (data as Article[]) || [];
        }
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
    const rawContent = article.content || article.summary || "Content unavailable. Please read the full article on the source website.";
    const isShortContent = rawContent.length < 300;

    // SEO: Prepare meta content
    const pageTitle = `${article.title} | ${SITE_NAME}`;
    const ogImage = article.image_url || DEFAULT_OG_IMAGE;
    const ogDescription = article.summary?.substring(0, 200) || "Read the latest AI news on AI Nexus.";

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

            <main className="container max-w-4xl py-8 md:py-16 px-4">
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
                    {/* Main Content Column */}
                    <article className="space-y-8">
                        {/* Header Section */}
                        <header className="space-y-6">
                            <div className="flex flex-wrap gap-2 items-center">
                                <Badge variant="secondary" className="text-sm font-medium px-3 py-1">
                                    {article.category}
                                </Badge>
                                {article.is_featured && (
                                    <Badge variant="default" className="text-sm font-medium px-3 py-1">
                                        Featured
                                    </Badge>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-foreground">
                                {article.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-b border-border pb-8">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{format(new Date(article.published_at), "MMMM d, yyyy")}</span>
                                </div>
                                {article.source && (
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span className="font-medium text-foreground">{article.source}</span>
                                    </div>
                                )}
                                {/* Share Buttons - Share internal URL */}
                                <div className="ml-auto">
                                    <ShareButtons title={article.title} url={currentUrl} />
                                </div>
                            </div>
                        </header>

                        {/* Featured Image */}
                        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
                            <NewsImage
                                src={article.image_url || ""}
                                alt={article.title}
                                className="h-full w-full object-cover"
                            />
                        </div>

                        {/* Content */}
                        <div className={`prose prose-lg dark:prose-invert max-w-none ${isShortContent ? 'text-xl leading-10' : ''}`}>
                            {rawContent.split('\n').map((paragraph, index) => (
                                paragraph.trim() && <p key={index} className="leading-relaxed text-foreground/90">{paragraph}</p>
                            ))}
                        </div>

                        {/* CTA Section */}
                        <div className="mt-12 rounded-2xl bg-muted/50 p-8 text-center border border-border">
                            <h3 className="text-xl font-semibold mb-2">Read the full story</h3>
                            <p className="text-muted-foreground mb-6">Read the original article on {article.source}</p>
                            <Button asChild size="lg" className="rounded-full px-8">
                                <a
                                    href={article.source_url || "#"}
                                    target="_blank"
                                    rel="nofollow noopener noreferrer"
                                    className="inline-flex items-center gap-2"
                                >
                                    Read on Source
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    </article>

                    {/* Sidebar Column */}
                    <aside className="hidden lg:block space-y-8">
                        {relatedNews && relatedNews.length > 0 && (
                            <TrendingSidebar trending={relatedNews} categories={[]} />
                        )}
                    </aside>
                </div>

                {/* Mobile Sidebar (Visible below content on small screens) */}
                <div className="lg:hidden mt-16 border-t pt-12">
                    <h3 className="text-2xl font-bold mb-6">Related News</h3>
                    {relatedNews && relatedNews.length > 0 && (
                        <TrendingSidebar trending={relatedNews} categories={[]} />
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default NewsDetailPage;
