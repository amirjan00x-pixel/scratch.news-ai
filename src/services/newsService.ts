import { supabase } from "@/integrations/supabase/client";
import { normalizeSearchQuery } from "@/lib/search";

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
}

export interface NewsFilter {
    category: string;
    searchQuery: string;
    sortBy: string;
}

const FRIENDLY_ERROR_MESSAGE = "Unable to load news articles right now. Please try again shortly.";

export const fetchNewsArticles = async ({ category, searchQuery, sortBy }: NewsFilter): Promise<Article[]> => {
    const normalizedQuery = normalizeSearchQuery(searchQuery);

    let query = supabase
        .from('news_articles')
        .select('*');

    if (category !== "All") {
        query = query.eq('category', category);
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
