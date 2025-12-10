# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/39a9dc6f-6738-4468-872e-fd27463e2be5

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/39a9dc6f-6738-4468-872e-fd27463e2be5) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/39a9dc6f-6738-4468-872e-fd27463e2be5) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Environment setup & secrets

This project relies on environment variables for every third-party credential. Follow these steps before running anything locally:

1. Copy each example file and fill in the real values that belong on your machine only:
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   ```
2. Required variables for the Vite frontend (public, non-sensitive):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SERVER_URL` (points to your authenticated fetcher, defaults to `http://localhost:3001`)
3. Required variables for the server-side fetcher (sensitive – never share):
   - `VITE_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_API_KEY`
   - `API_ALLOWED_ORIGINS`
   - Optional Hugging Face tuning knobs: `HF_API_TOKEN`, `HF_IMAGE_MODEL`, `HF_IMAGE_ENDPOINT`, `HF_IMAGE_SIZE`, `HF_IMAGE_GUIDANCE`, `HF_IMAGE_NEGATIVE_PROMPT`

`.gitignore` protects every `.env` file so real keys are never committed again. If you previously exposed a key, rotate it in Supabase/Hugging Face immediately before redeploying.

## Securing admin endpoints

Privileged functionality is guarded by rate-limited API-key authentication plus restricted CORS. To keep the installation secure:

1. **Set strong secrets**  
   - Define a long, random `ADMIN_API_KEY` in `server/.env`. The server refuses to boot without it.  
   - Keep Supabase service role keys and Hugging Face tokens in the same file—never in Git history.
2. **Whitelist your domains**  
   - Populate `API_ALLOWED_ORIGINS` with a comma-separated list (e.g. `http://localhost:5173,http://localhost:3000,https://news.example.com`).  
   - Only those origins receive CORS approval; other domains are blocked with HTTP 403.
3. **Trigger fetch jobs safely**  
   - Use the built-in Admin page (hidden until you authenticate) or call the API directly:  
     ```bash
     curl -X POST "$SERVER_URL/api/fetch-news" \
       -H "x-api-key: $ADMIN_API_KEY"
     ```  
   - Requests are limited to 5/min per IP. Exceeding the limit yields HTTP 429.
4. **Logging & monitoring**  
   - Unauthorized attempts and blocked origins are logged with IP + route only; secrets are never written to logs.  
   - Handle failures by checking the server logs or the JSON response—the payload intentionally omits secret data.

Rotate `ADMIN_API_KEY` any time you suspect exposure, then redeploy both server and any long-lived admin clients (they will be forced to re-authenticate).

## Local Development Mode (Vercel detached)

The repository is currently configured to run entirely on your machine without any Vercel routing or env injection. Nothing was deleted—when you are ready to redeploy, just reconnect the repo to Vercel and reuse the same environment variables.

### One-time setup

1. Copy the env templates and fill in real values:
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   ```
2. Ensure the following variables exist:
   - Frontend `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SERVER_URL=http://localhost:3001`
   - Backend `server/.env`: `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_API_KEY`, `API_ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"`
3. Install dependencies:
   ```bash
   npm install
   npm --prefix server install
   ```

### Running locally

Use two terminals so the frontend and backend stay in sync:

```bash
# Terminal 1 - backend (Express + Supabase integration)
npm run server  # loads server/.env and listens on http://localhost:3001

# Terminal 2 - frontend (Vite dev server on http://localhost:5173)
npm run dev
```

### Verification checklist

- Frontend loads on `http://localhost:5173` and points `VITE_SERVER_URL` to `http://localhost:3001`.
- Backend responds at `http://localhost:3001/api/newsletter/subscribe` (try `curl -X POST` with a JSON body).
- Supabase credentials allow both anon reads (frontend) and service-role inserts (backend).
- Newsletter signup succeeds from the modal and returns 200, 400, or 409 as expected.
- Admin endpoints (`/api/admin/authenticate`, `/api/admin/newsletter/stats`, `/api/fetch-news`) require the `x-api-key` header that matches `ADMIN_API_KEY`.
- No runtime dependency on `.vercel` or Vercel APIs—the project runs with local `.env` files only.

### Re-enabling Vercel later

When you are ready to redeploy, simply re-link the repository/project inside Vercel, copy the same env variables into the Vercel dashboard, and trigger a new deployment. No additional code changes are required.

## Search & filtering

- The header search opens a secure popover and dispatches a `search` custom event with `{ query: string }`. The homepage listens for that event and re-runs the Supabase query immediately.
- Search requests run through `normalizeSearchQuery`, which trims whitespace and strips reserved SQL characters (commas, parentheses, quotes, `%`, `_`). Empty or malformed input simply returns the latest articles instead of throwing an error.
- Supabase filtering uses parameterized helpers (`.ilike`, `.or`) across the `title`, `summary`, and `source` columns. Because the query is normalized, user input never appears unescaped inside filter strings, closing off injection vectors.
- Errors from Supabase are wrapped in a user-friendly message so SQL payloads never reach the client or console logs.
