import { supabase } from "@/integrations/supabase/client";
import { normalizeSearchQuery } from "@/lib/search";
import { ArticleCategory, isArticleCategory } from "@/constants/categories";

export interface Article {
    id: string;
    title: string;
    summary: string;
    category: string;
    source: string;
    source_url: string;
    image_url: string;
    importance_score: number;
    is_featured: boolean;
    published_at: string;
    created_at: string;
    graph_data?: {
        relationships?: string[];
        trends?: string;
        triples?: Array<{ s: string; p: string; o: string }>;
    };
}

export interface NewsFilter {
    category: ArticleCategory | "All";
    searchQuery: string;
    sortBy: string;
}

const FRIENDLY_ERROR_MESSAGE = "Unable to load news articles right now. Please try again shortly.";

const isAllCategory = (value: string): value is "All" => value === "All";

export const fetchNewsArticles = async ({ category, searchQuery, sortBy }: NewsFilter): Promise<Article[]> => {
    const normalizedQuery = normalizeSearchQuery(searchQuery);

    let query = supabase
        .from('news_articles')
        .select('*');

    if (!isAllCategory(category) && !isArticleCategory(category)) {
        console.warn(`Unknown category "${category}" requested. Falling back to All.`);
        category = "All";
    }

    if (!isAllCategory(category)) {
        query = query.eq('category', category as ArticleCategory);
    }

    if (normalizedQuery) {
        const likePattern = `%${normalizedQuery}%`;
        const filters = [
            `title.ilike.${likePattern}`,
            `summary.ilike.${likePattern}`,
            `source.ilike.${likePattern}`,
        ].join(',');

        query = query.or(filters);
    }

    if (sortBy === "importance") {
        query = query.order('importance_score', { ascending: false });
    } else if (sortBy === "title") {
        query = query.order('title', { ascending: true });
    } else {
        query = query.order('published_at', { ascending: false });
    }

    const { data, error } = await query.limit(30);

    if (error) {
        throw new Error(FRIENDLY_ERROR_MESSAGE);
    }

    return (data as Article[]) || [];
};
