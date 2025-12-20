// Read at runtime, not module load time
const getConfig = () => ({
    baseUrl: process.env.OPENROUTER_BASE_URL?.trim() || 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY?.trim() || '',
    defaultModel: process.env.OPENROUTER_DEFAULT_MODEL?.trim() || 'nvidia/nemotron-3-nano-30b-a3b:free',
    siteUrl: process.env.OPENROUTER_SITE_URL || 'https://github.com/new20/scratch.news-ai',
    appName: process.env.OPENROUTER_APP_NAME || 'scratch.news-ai',
    timeoutMs: Number(process.env.OPENROUTER_TIMEOUT_MS || '20000')
});

function withTimeout(timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return {
        signal: controller.signal,
        clear: () => clearTimeout(timer)
    };
}

function ensureKey() {
    const config = getConfig();
    if (!config.apiKey) {
        throw new Error(
            'OPENROUTER_API_KEY is missing. Please set it in server/.env.'
        );
    }
    return config;
}

export async function generateWithOpenRouter({
    prompt,
    model,
    temperature = 0.2,
    maxTokens = 400,
    systemPrompt = 'You are a concise AI assistant.'
}) {
    const config = ensureKey();
    const useModel = model || config.defaultModel;

    if (!prompt) {
        throw new Error('generateWithOpenRouter requires a prompt string.');
    }

    const payload = {
        model: useModel,
        temperature,
        max_tokens: maxTokens,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ]
    };

    const endpoint = `${config.baseUrl.replace(
        /\/$/,
        ''
    )}/chat/completions`;
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        'HTTP-Referer': config.siteUrl,
        'X-Title': config.appName
    };

    const { signal, clear } = withTimeout(config.timeoutMs);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal
        });
        clear();

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `OpenRouter request failed (${response.status}): ${errorBody}`
            );
        }

        const data = await response.json();
        const choice = data?.choices?.[0];
        const text =
            choice?.message?.content ||
            choice?.delta?.content ||
            data?.output?.[0]?.content;

        if (!text) {
            throw new Error('OpenRouter response missing text content.');
        }

        return text.trim();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(
                `Timed out waiting for OpenRouter response.`
            );
        }
        throw new Error(`OpenRouter request failed: ${error.message}`);
    }
}

export default {
    generateWithOpenRouter
};
