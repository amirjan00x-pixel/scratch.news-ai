-- Allow service role and anon to insert news articles
CREATE POLICY "Allow insert for service role and anon" 
ON public.news_articles 
FOR INSERT 
WITH CHECK (true);

-- Allow service role to update news articles
CREATE POLICY "Allow update for service role" 
ON public.news_articles 
FOR UPDATE 
USING (true);

-- Allow service role to delete news articles
CREATE POLICY "Allow delete for service role" 
ON public.news_articles 
FOR DELETE 
USING (true);