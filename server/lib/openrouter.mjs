const OPENROUTER_BASE_URL =
    process.env.OPENROUTER_BASE_URL?.trim() ||
    'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim() || '';
const OPENROUTER_DEFAULT_MODEL =
    process.env.OPENROUTER_DEFAULT_MODEL?.trim() ||
    'nvidia/nemotron-3-nano-30b-a3b:free';
const OPENROUTER_SITE_URL =
    process.env.OPENROUTER_SITE_URL ||
    'https://github.com/new20/scratch.news-ai';
const OPENROUTER_APP_NAME =
    process.env.OPENROUTER_APP_NAME || 'scratch.news-ai';
const OPENROUTER_TIMEOUT_MS = Number(
    process.env.OPENROUTER_TIMEOUT_MS || '20000'
);

function withTimeout(timeoutMs = OPENROUTER_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return {
        signal: controller.signal,
        clear: () => clearTimeout(timer)
    };
}

function ensureKey() {
    if (!OPENROUTER_API_KEY) {
        throw new Error(
            'OPENROUTER_API_KEY is missing. Please set it in server/.env.'
        );
    }
}

export async function generateWithOpenRouter({
    prompt,
    model = OPENROUTER_DEFAULT_MODEL,
    temperature = 0.2,
    maxTokens = 400,
    systemPrompt = 'You are a concise AI assistant.'
}) {
    ensureKey();

    if (!prompt) {
        throw new Error('generateWithOpenRouter requires a prompt string.');
    }

    const payload = {
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ]
    };

    const endpoint = `${OPENROUTER_BASE_URL.replace(
        /\/$/,
        ''
    )}/chat/completions`;
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': OPENROUTER_SITE_URL,
        'X-Title': OPENROUTER_APP_NAME
    };

    const { signal, clear } = withTimeout();

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
                `Timed out after ${OPENROUTER_TIMEOUT_MS}ms waiting for OpenRouter response.`
            );
        }
        throw new Error(`OpenRouter request failed: ${error.message}`);
    }
}

export default {
    generateWithOpenRouter
};
