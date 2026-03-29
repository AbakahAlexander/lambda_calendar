# lambda_calendar

Natural-language events → Mistral AI → your Google Calendar (Next.js + Auth.js).

## Local setup

```bash
npm install
cp .env.example .env
```

Fill `.env` (see `.env.example`), enable **Google Calendar API**, create an OAuth **Web client**, then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Netlify (free tier) + `certifore.dev`

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In [Netlify](https://app.netlify.com): **Add new site** → **Import an existing project** → pick the repo.
3. Build settings are read from `netlify.toml` (`npm run build`, Node 22, `@netlify/plugin-nextjs`).
4. **Domain**: **Domain settings** → **Add custom domain** → `certifore.dev` (or a subdomain e.g. `app.certifore.dev`). Netlify will show **DNS records** to add at your registrar (usually A/AAAA for apex or CNAME for subdomain).
5. Turn on **HTTPS** (Let’s Encrypt) in Netlify once DNS resolves.

### Environment variables (Site configuration → Environment variables)

Set for **Production** (and **Deploy previews** if you want previews to work):

| Name | Value |
|------|--------|
| `MISTRAL_API_KEY` | Your Mistral API key |
| `AUTH_SECRET` | Long random string (e.g. `openssl rand -base64 32`) |
| `AUTH_URL` | **Exact** public origin, e.g. `https://certifore.dev` or `https://app.certifore.dev` — **no trailing slash** |
| `GOOGLE_CLIENT_ID` | From Google Cloud OAuth client |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud OAuth client |

Redeploy after changing env vars.

### Google Cloud (production URL)

For the **same** origin as `AUTH_URL`, add to the OAuth **Web client**:

- **Authorized JavaScript origins**: `https://certifore.dev` (or your chosen subdomain URL)
- **Authorized redirect URIs**: `https://certifore.dev/api/auth/callback/google`

On the OAuth **Branding** / **Authorized domains** screen, add **`certifore.dev`** and verify in **Google Search Console** when Google asks.

### Public pages (verification)

After deploy, use these in Google Cloud branding:

- Home: `https://<your-host>/`
- Privacy: `https://<your-host>/privacy`
- Terms: `https://<your-host>/terms`
