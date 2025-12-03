-- Create posts table for AI-generated content
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read posts
CREATE POLICY "Anyone can view posts" 
ON public.posts 
FOR SELECT 
USING (true);

-- Create index for sorting by date
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);