-- Allow public (anon) to read news articles
-- This is required for the frontend to display news

CREATE POLICY "Allow public read access"
ON public.news_articles
FOR SELECT
USING (true);
