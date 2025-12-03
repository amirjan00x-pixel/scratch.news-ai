-- Create news articles table
CREATE TABLE public.news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  image_url TEXT,
  importance_score INTEGER NOT NULL DEFAULT 5,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_featured BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view news articles" 
ON public.news_articles 
FOR SELECT 
USING (true);

-- Create index for better query performance
CREATE INDEX idx_news_published_at ON public.news_articles(published_at DESC);
CREATE INDEX idx_news_importance ON public.news_articles(importance_score DESC);
CREATE INDEX idx_news_category ON public.news_articles(category);

-- Create AI history table
CREATE TABLE public.ai_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for AI history
ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to AI history
CREATE POLICY "Anyone can view AI history" 
ON public.ai_history 
FOR SELECT 
USING (true);

-- Insert some AI history milestones
INSERT INTO public.ai_history (year, title, description) VALUES
(1950, 'Alan Turing Test', 'Alan Turing publishes "Computing Machinery and Intelligence" proposing the Turing Test.'),
(1956, 'Birth of AI', 'The term "Artificial Intelligence" is coined at the Dartmouth Conference.'),
(1997, 'Deep Blue Victory', 'IBM''s Deep Blue defeats world chess champion Garry Kasparov.'),
(2011, 'Watson Wins Jeopardy', 'IBM Watson defeats human champions in Jeopardy!'),
(2012, 'Deep Learning Breakthrough', 'AlexNet wins ImageNet competition, sparking deep learning revolution.'),
(2016, 'AlphaGo Victory', 'DeepMind''s AlphaGo defeats world Go champion Lee Sedol.'),
(2017, 'Transformer Architecture', 'Google introduces the Transformer architecture in "Attention is All You Need".'),
(2020, 'GPT-3 Released', 'OpenAI releases GPT-3, demonstrating remarkable language understanding.'),
(2022, 'ChatGPT Launch', 'OpenAI launches ChatGPT, bringing AI to mainstream users.'),
(2023, 'GPT-4 & Multimodal AI', 'GPT-4 and other multimodal models demonstrate advanced reasoning capabilities.');