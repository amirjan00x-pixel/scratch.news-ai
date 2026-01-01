import { generateWithOpenRouter } from './lib/openrouter.mjs';

const logErrorDetails = (context, err) => {
    const error = err ?? {};
    console.error(context, {
        message: error?.message ?? String(err ?? 'Unknown error'),
        status: error?.status,
        responseData: error?.response?.data
    });
};

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
        logErrorDetails('OpenRouter test failed', error);
        process.exit(1);
    }
}

main();
