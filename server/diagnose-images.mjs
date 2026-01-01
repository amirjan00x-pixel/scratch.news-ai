import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingEnv = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnv.length) {
    console.error(
        `Missing required environment variables: ${missingEnv.join(', ')}`
    );
    process.exit(1);
}

const logErrorDetails = (context, err) => {
    const error = err ?? {};
    console.error(context, {
        message: error?.message ?? String(err ?? 'Unknown error'),
        status: error?.status,
        responseData: error?.response?.data
    });
};

const logSupabaseError = (context, data, error) => {
    console.error(context, {
        data,
        error
    });
};

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FALLBACK_PREFIXES = [
    'https://source.unsplash.com/featured/',
    'http://source.unsplash.com/featured/'
];

function isValidRenderableImageUrl(value) {
    if (value == null) return false;
    const url = String(value).trim();
    if (!url) return false;
    if (url === 'null' || url === 'undefined') return false;
    if (url.startsWith('data:image/')) return true;
    if (url.startsWith('https://') || url.startsWith('http://')) return true;
    // Relative paths or protocol-less values will break in the browser.
    return false;
}

function isGenericFallbackUrl(value) {
    if (!value) return false;
    const url = String(value).trim();
    return FALLBACK_PREFIXES.some((prefix) => url.startsWith(prefix));
}

async function diagnose() {
    const { data, error } = await supabase
        .from('news_articles')
        .select('id, title, category, source, image_url, published_at')
        .order('published_at', { ascending: false })
        .limit(200);

    if (error) {
        logSupabaseError('Failed to load recent articles for image diagnosis', data, error);
        throw error;
    }

    const rows = data ?? [];
    const broken = rows.filter((row) => !isValidRenderableImageUrl(row.image_url));
    const fallbacks = rows.filter((row) => isGenericFallbackUrl(row.image_url));

    console.log(`Checked ${rows.length} recent articles.`);
    console.log(`Broken/non-renderable image_url: ${broken.length}`);
    console.log(`Generic fallback (source.unsplash.com/featured): ${fallbacks.length}`);

    if (broken.length) {
        console.log('\nExamples of broken image_url values:');
        for (const row of broken.slice(0, 15)) {
            console.log(
                `- ${row.id} | ${row.category} | ${row.source} | ${row.title} | image_url=${JSON.stringify(
                    row.image_url
                )}`
            );
        }
    }

    if (process.env.DIAGNOSE_REMOTE === '1') {
        const candidates = rows
            .filter((row) => isValidRenderableImageUrl(row.image_url))
            .slice(0, 25);

        console.log('\nRemote image checks (first 25 renderable URLs):');
        for (const row of candidates) {
            const url = String(row.image_url).trim();
            if (url.startsWith('data:image/')) {
                console.log(`- OK data URI | ${row.title}`);
                continue;
            }

            try {
                const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
                const contentType = response.headers.get('content-type') || '';
                const ok = response.ok && contentType.toLowerCase().startsWith('image/');
                console.log(
                    `- ${ok ? 'OK' : 'BAD'} ${response.status} ${contentType || 'no-content-type'} | ${row.title} | ${url}`
                );
            } catch (err) {
                logErrorDetails(`Remote image check failed for ${row.title}`, err);
                console.log(
                    `- BAD fetch-error | ${row.title} | ${url} | ${err?.message || err}`
                );
            }
        }
    }
}

diagnose().catch((err) => {
    logErrorDetails('Diagnose failed', err);
    process.exit(1);
});
