import { generateWithOpenRouter } from './lib/openrouter.mjs';

async function main() {
    try {
        const prompt =
            'In two sentences, summarize the current landscape of AI assistants.';
        const response = await generateWithOpenRouter({
            prompt,
            temperature: 0.3,
            maxTokens: 200
        });

        console.log('=== OpenRouter Response ===\n');
        console.log(response);
    } catch (error) {
        console.error('OpenRouter test failed:', error.message);
        process.exit(1);
    }
}

main();
