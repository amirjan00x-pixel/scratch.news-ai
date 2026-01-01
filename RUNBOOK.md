# RUNBOOK

## A) How to run the project

### Frontend (Vite)
```bash
npm install
npm run dev
```

### Backend (Express)
```bash
npm --prefix server install
npm run server
```

### Node/npm versions
- Not specified in this repo (no `.nvmrc`, `.node-version`, or `engines` field found).

## B) Environment variables (only those read in code)

### Frontend (Vite)
- `VITE_SUPABASE_URL="https://project-ref.supabase.co"`  
  Used by the frontend Supabase client to read data.
- `VITE_SUPABASE_ANON_KEY="public-anon-key"`  
  Used by the frontend Supabase client to authenticate read requests.
- `VITE_SERVER_URL="http://localhost:3001"`  
  Base URL for the backend API (newsletter + admin actions).

### Backend (Express server)
- `VITE_SUPABASE_URL="https://project-ref.supabase.co"`  
  Used by the server Supabase client for inserts/updates/selects.
- `SUPABASE_SERVICE_ROLE_KEY="service-role-key"`  
  Required for server-side writes to Supabase.
- `ADMIN_API_KEY="super-secure-admin-key"`  
  Required to access admin endpoints.
- `API_ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"`  
  CORS whitelist for API requests.
- `OPENROUTER_API_KEY="sk-or-xxxx"`  
  Required for AI summarization (OpenRouter).
- `OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"`  
  Overrides OpenRouter base URL.
- `OPENROUTER_DEFAULT_MODEL="nvidia/nemotron-3-nano-30b-a3b:free"`  
  Default OpenRouter model for summaries.
- `OPENROUTER_SITE_URL="https://example.com"`  
  Passed to OpenRouter headers.
- `OPENROUTER_APP_NAME="scratch.news-ai"`  
  Passed to OpenRouter headers.
- `OPENROUTER_TIMEOUT_MS="20000"`  
  Request timeout for OpenRouter.
- `HF_API_TOKEN="hf_xxx"`  
  Enables Hugging Face image generation fallback.
- `HF_IMAGE_MODEL="stabilityai/stable-diffusion-xl-base-1.0"`  
  Hugging Face model name for image generation.
- `HF_IMAGE_ENDPOINT="https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0"`  
  Overrides Hugging Face inference endpoint.
- `HF_IMAGE_SIZE="1024x576"`  
  Size of generated images.
- `HF_IMAGE_GUIDANCE="7"`  
  Guidance scale for image generation.
- `HF_IMAGE_NEGATIVE_PROMPT="text, watermark, logo"`  
  Negative prompt for image generation.
- `MAX_SOURCES_PER_RUN="30"`  
  Limits how many sources are processed per ingestion run.
- `AUTO_FETCH_NEWS_MINUTES="0"`  
  Enables periodic auto-fetch when > 0.
- `PORT="3001"`  
  Server listen port.

### Scripts
- `VITE_SUPABASE_URL="https://project-ref.supabase.co"`  
  Used by image backfill/diagnostics to connect to Supabase.
- `SUPABASE_SERVICE_ROLE_KEY="service-role-key"`  
  Used by image backfill/diagnostics for write access.
- `UNSPLASH_ACCESS_KEY="unsplash-access-key"`  
  Required for `server/backfill-article-images.mjs` Unsplash lookups.
- `PIXABAY_API_KEY="pixabay-api-key"`  
  Optional fallback for `server/backfill-article-images.mjs`.
- `IMAGE_BACKFILL_BATCH_SIZE="15"`  
  Batch size for image backfill script.
- `DIAGNOSE_REMOTE="1"`  
  Enables remote image HEAD checks in `server/diagnose-images.mjs`.
- `OPENROUTER_API_KEY="sk-or-xxxx"`  
  Required by `server/test-openrouter.mjs` via `server/lib/openrouter.mjs`.
- `ADMIN_API_KEY="super-secure-admin-key"`  
  Required by `server/lib/openrouter.mjs` preflight.
- `API_ALLOWED_ORIGINS="http://localhost:5173"`  
  Required by `server/lib/openrouter.mjs` preflight.

### Edge Functions (Supabase)
- `SUPABASE_URL="https://project-ref.supabase.co"`  
  Supabase project URL for Edge Functions.
- `SUPABASE_SERVICE_ROLE_KEY="service-role-key"`  
  Required for Edge Functions to insert data.
- `OPENROUTER_API_KEY="sk-or-xxxx"`  
  Required for OpenRouter requests in Edge Functions.
- `OPENROUTER_SITE_URL="https://example.com"`  
  Passed to OpenRouter headers.
- `OPENROUTER_APP_NAME="scratch.news-ai"`  
  Passed to OpenRouter headers.

## C) API testing

### POST /api/admin/authenticate
```bash
curl -X POST "http://localhost:3001/api/admin/authenticate" \
  -H "x-api-key: super-secure-admin-key"
```
Success (200):
```json
{ "success": true }
```
Failure:
- 401: invalid or missing `x-api-key`
- 429: rate limit exceeded

### POST /api/fetch-news
```bash
curl -X POST "http://localhost:3001/api/fetch-news" \
  -H "x-api-key: super-secure-admin-key"
```
Success (200) includes a `debug` block:
```json
{
  "success": true,
  "message": "Upserted 12 news articles",
  "count": 12,
  "debug": {
    "supabaseProjectRef": "project-ref",
    "sourcesLoadedCount": 150,
    "categoriesLoadedCount": 6,
    "openrouterEnabled": true,
    "articlesFetchedCount": 120,
    "articlesSummarizedCount": 30,
    "upsertedCount": 12
  }
}
```
Failure:
- 401: invalid or missing `x-api-key`
- 403: origin blocked by CORS
- 429: rate limit exceeded
- 500: upstream/API/DB error (response includes `debug`)

### POST /api/newsletter/subscribe
```bash
curl -X POST "http://localhost:3001/api/newsletter/subscribe" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"source\":\"manual-test\"}"
```
Success (200):
```json
{ "success": true, "message": "Thanks for subscribing!" }
```
Failure:
- 400: invalid email
- 409: duplicate subscription
- 500: server or database error
