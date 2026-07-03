# Deploying Kanal to Vercel

Kanal is a static, local-first SPA (Vite + PWA) — no server, no environment
variables, no database to provision. Deploying is just publishing `dist/`.

## One-time setup (5 minutes)

1. Install the Vercel CLI globally:
   ```
   npm install -g vercel
   ```

2. From the `kanal/` project root, sign in:
   ```
   vercel login
   ```
   (Follow the browser prompt to authenticate.)

3. Deploy for the first time:
   ```
   vercel
   ```
   Answer the prompts:
   - Set up and deploy? **Y**
   - Which scope? *(your personal account)*
   - Link to existing project? **N**
   - Project name? **kanal**
   - In which directory is your code located? **./**
   - Override settings? **N** (`vercel.json` already sets build + output)

4. Wait ~1 minute for the build. You'll get a preview URL like
   `kanal-abc123.vercel.app`.

## Production deploy

After the first deploy, promote to production with:
```
vercel --prod
```
This publishes to `kanal.vercel.app` (or your custom domain if set).

## Optional: custom domain

Buy a domain (e.g. `kanal.app` on Porkbun or Namecheap). In the Vercel
dashboard: your project → **Settings → Domains** → add the domain, then follow
the DNS instructions Vercel provides.

## Verify the deploy

- [ ] Open the URL on desktop → every tab works
- [ ] Open on Android Chrome → the install banner appears after some use;
      or menu → *Add to Home screen*
- [ ] Open on iOS Safari → Share → *Add to Home Screen*
- [ ] DevTools → Network → **Offline**, reload → the app still works and you can
      still catat transaksi (data lives in IndexedDB)

## Notes

- The SPA rewrite in `vercel.json` sends every path to `index.html`; navigation
  is client-side, so deep links resolve to Beranda.
- The service worker uses `autoUpdate`: a new deploy is picked up on the next
  visit automatically.
- All data is stored locally in the browser (IndexedDB via Dexie). Nothing is
  ever sent to a server, so there is nothing to secure server-side.
