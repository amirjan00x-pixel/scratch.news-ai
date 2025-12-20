import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting AI post generation...');
    
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SITE_URL = Deno.env.get('OPENROUTER_SITE_URL') ?? 'https://github.com/new20/scratch.news-ai';
    const APP_NAME = Deno.env.get('OPENROUTER_APP_NAME') ?? 'scratch.news-ai';

    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Call OpenRouter API with nvidia/nemotron-3-nano-30b-a3b:free model
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': SITE_URL,
        'X-Title': APP_NAME,
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-nano-30b-a3b:free',
        messages: [
          {
            role: 'system',
            content: 'You are a creative content writer. Generate engaging blog posts about technology, science, or interesting topics. Each post should have a compelling title and well-written content (500-800 words). Format: Return only JSON with "title" and "content" fields.'
          },
          {
            role: 'user',
            content: 'Generate a new blog post about an interesting topic. Make it informative and engaging.'
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices[0].message.content;
    
    console.log('AI generated content:', generatedText.substring(0, 200) + '...');

    // Parse the AI response to extract title and content
    let title = '';
    let content = '';
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(generatedText);
      title = parsed.title || 'Untitled Post';
      content = parsed.content || generatedText;
    } catch {
      // If not JSON, extract title and content from text
      const lines = generatedText.split('\n').filter((line: string) => line.trim());
      title = lines[0]?.replace(/^#+\s*/, '').replace(/^["']|["']$/g, '').trim() || 'Generated Post';
      content = lines.slice(1).join('\n\n').trim() || generatedText;
    }

    // Insert the generated post into the database
    const { data: newPost, error: insertError } = await supabase
      .from('posts')
      .insert({
        title,
        content
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    console.log('Successfully created post:', newPost.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        post: newPost,
        message: 'Post generated and saved successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in generate-post function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
