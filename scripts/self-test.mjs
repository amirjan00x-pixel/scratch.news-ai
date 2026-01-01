const REQUIRED_ENV_VARS = ['VITE_SERVER_URL', 'ADMIN_API_KEY'];

const missingEnv = REQUIRED_ENV_VARS.filter(
  (name) => !process.env[name] || !String(process.env[name]).trim()
);

if (missingEnv.length) {
  console.error(
    `Missing required environment variables: ${missingEnv.join(', ')}`
  );
  process.exit(1);
}

const baseUrl = process.env.VITE_SERVER_URL.replace(/\/$/, '');
const adminKey = process.env.ADMIN_API_KEY;

const logErrorDetails = (context, err) => {
  const error = err ?? {};
  console.error(context, {
    message: error?.message ?? String(err ?? 'Unknown error'),
    status: error?.status,
    responseData: error?.response?.data
  });
};

const readJson = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    logErrorDetails('Failed to parse JSON response', error);
    throw new Error(`Non-JSON response: ${text.slice(0, 200)}`);
  }
};

const post = async (path, extraHeaders = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'x-api-key': adminKey,
      'Content-Type': 'application/json',
      ...extraHeaders
    }
  });
  const payload = await readJson(response);
  return { response, payload };
};

const run = async () => {
  console.log(`Self-test starting against ${baseUrl}`);

  const auth = await post('/api/admin/authenticate');
  if (!auth.response.ok) {
    console.error('Admin auth failed.');
    console.error(auth.payload || auth.response.statusText);
    process.exit(1);
  }
  console.log('Admin auth: OK');

  const fetchResult = await post('/api/fetch-news', { 'x-self-test': 'true' });
  if (!fetchResult.response.ok) {
    console.error('Fetch news failed.');
    console.error(fetchResult.payload || fetchResult.response.statusText);
    process.exit(1);
  }

  const debug = fetchResult.payload?.debug || {};
  console.log('Fetch news: OK');
  console.log('Debug summary:');
  console.log(`- supabaseProjectRef: ${debug.supabaseProjectRef ?? 'unknown'}`);
  console.log(`- sourcesLoadedCount: ${debug.sourcesLoadedCount ?? 'unknown'}`);
  console.log(`- categoriesLoadedCount: ${debug.categoriesLoadedCount ?? 'unknown'}`);
  console.log(`- openrouterEnabled: ${debug.openrouterEnabled ?? 'unknown'}`);
  console.log(`- articlesFetchedCount: ${debug.articlesFetchedCount ?? 'unknown'}`);
  console.log(`- articlesSummarizedCount: ${debug.articlesSummarizedCount ?? 'unknown'}`);
  console.log(`- upsertedCount: ${debug.upsertedCount ?? 'unknown'}`);
};

run().catch((error) => {
  logErrorDetails('Self-test failed', error);
  process.exit(1);
});
