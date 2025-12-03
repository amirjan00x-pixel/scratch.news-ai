-- Create ai_tracker table for tracking GPT versions, API changes, pricing, and features
CREATE TABLE public.ai_tracker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'version', 'api', 'pricing', 'feature'
  change_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_tracker ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view AI tracker updates" 
ON public.ai_tracker 
FOR SELECT 
USING (true);

-- Create index for faster queries
CREATE INDEX idx_ai_tracker_change_date ON public.ai_tracker(change_date DESC);
CREATE INDEX idx_ai_tracker_category ON public.ai_tracker(category);

-- Insert some sample data
INSERT INTO public.ai_tracker (title, description, category, change_date, source, source_url) VALUES
('GPT-5 Released', 'OpenAI releases GPT-5 with improved reasoning capabilities and larger context window', 'version', now() - interval '2 days', 'OpenAI', 'https://openai.com'),
('API Rate Limit Increase', 'Rate limits increased to 10,000 requests per minute for premium users', 'api', now() - interval '5 days', 'OpenAI', 'https://openai.com/api'),
('Pricing Update', 'GPT-4 pricing reduced by 50% for all tiers', 'pricing', now() - interval '7 days', 'OpenAI', 'https://openai.com/pricing'),
('Function Calling V2', 'New function calling API with better reliability and structured outputs', 'feature', now() - interval '10 days', 'OpenAI', 'https://openai.com/blog'),
('Claude 3.5 Sonnet', 'Anthropic releases Claude 3.5 Sonnet with improved coding capabilities', 'version', now() - interval '15 days', 'Anthropic', 'https://anthropic.com'),
('Gemini Pro Vision', 'Google releases Gemini Pro Vision with multimodal capabilities', 'version', now() - interval '20 days', 'Google', 'https://deepmind.google'),
('API Deprecation Notice', 'Legacy completion API will be deprecated in 6 months', 'api', now() - interval '25 days', 'OpenAI', 'https://openai.com/api'),
('New Embedding Model', 'text-embedding-3-large now available with better performance', 'feature', now() - interval '30 days', 'OpenAI', 'https://openai.com/blog');