const REQUIRED_ENV_VARS = [
    'VITE_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ADMIN_API_KEY',
    'API_ALLOWED_ORIGINS',
    'OPENROUTER_API_KEY'
];

const missingEnv = REQUIRED_ENV_VARS.filter(
    (name) => !process.env[name] || !String(process.env[name]).trim()
);

if (missingEnv.length) {
    const message = `Missing required environment variables: ${missingEnv.join(', ')}`;
    console.error(message);
    throw new Error(message);
}

const logErrorDetails = (context, err) => {
    const error = err ?? {};
    console.error(context, {
        message: error?.message ?? String(err ?? 'Unknown error'),
        status: error?.status,
        responseData: error?.response?.data
    });
};

let hasLoggedRawResponse = false;
let hasLoggedModel = false;
let hasLoggedKeyLength = false;

// Read at runtime, not module load time
const getConfig = () => ({
    baseUrl: process.env.OPENROUTER_BASE_URL?.trim() || 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY?.trim() || '',
    defaultModel: process.env.OPENROUTER_DEFAULT_MODEL?.trim() || 'xiaomi/mimo-v2-flash:free',
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

    if (!hasLoggedModel) {
        console.log(`OpenRouter model in use: ${useModel}`);
        hasLoggedModel = true;
    }
    if (!hasLoggedKeyLength) {
        console.log(`OpenRouter keyLength: ${config.apiKey.length}`);
        hasLoggedKeyLength = true;
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
            if (!hasLoggedRawResponse) {
                console.log('OpenRouter raw response (first call):');
                console.log(errorBody);
                hasLoggedRawResponse = true;
            }
            throw new Error(
                `OpenRouter request failed (${response.status}): ${errorBody}`
            );
        }

        const rawBody = await response.text();
        if (!hasLoggedRawResponse) {
            console.log('OpenRouter raw response (first call):');
            console.log(rawBody);
            hasLoggedRawResponse = true;
        }
        const data = JSON.parse(rawBody);
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
            logErrorDetails('OpenRouter request timed out', error);
            throw new Error('Timed out waiting for OpenRouter response.');
        }
        logErrorDetails('OpenRouter request failed', error);
        throw new Error(`OpenRouter request failed: ${error.message}`);
    }
}

export default {
    generateWithOpenRouter
};
