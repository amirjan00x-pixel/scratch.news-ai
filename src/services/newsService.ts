
import { supabase } from "@/integrations/supabase/client";

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

export const fetchNewsArticles = async ({ category, searchQuery, sortBy }: NewsFilter): Promise<Article[]> => {
    let query = supabase
        .from('news_articles')
        .select('*');

    if (category !== "All") {
        query = query.eq('category', category);
    }

    if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%`);
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
        console.error("Error fetching news:", error);
        throw new Error(error.message);
    }

    return (data as Article[]) || [];
};
