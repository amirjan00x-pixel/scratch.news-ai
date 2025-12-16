import { detectOllamaModel, generateWithOllama } from './lib/ollama.mjs';

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
        console.error('Ollama test failed:', error.message);
        process.exit(1);
    }
}

main();
