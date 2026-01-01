import { detectOllamaModel, generateWithOllama } from './lib/ollama.mjs';

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
        const model = await detectOllamaModel();
        console.log(`Detected Ollama model: ${model}`);

        const prompt =
            'Provide a two sentence summary of the current state of AI assistants.';
        const output = await generateWithOllama({
            prompt,
            model,
            temperature: 0.2,
            maxTokens: 200
        });

        console.log('\n=== Ollama Response ===\n');
        console.log(output);
    } catch (error) {
        logErrorDetails('Ollama test failed', error);
        process.exit(1);
    }
}

main();
