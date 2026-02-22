# obsidian-redirect

HTTPS → `obsidian://` redirect service for Telegram deep links.

**Problem:** Telegram only hyperlinks `http://` and `https://` URLs — `obsidian://` URIs render as plain unclickable text. Worse, Telegram's iOS in-app browser (WKWebView) blocks script-initiated navigation to custom URI schemes, so a raw server-side 302 redirect silently fails.

**Solution:** Serve an HTML page at `obs.gisk0.dev` with a visible **"Open in Obsidian →"** button as the primary path (user-initiated tap passes WKWebView security checks), plus a JS redirect as a bonus for macOS desktop browsers.

## URL Formats

### Shorthand (recommended for Giskard-generated links)

```
https://obs.gisk0.dev/<VaultName>/<file-path>
```

- Slashes in the file path must be encoded as `%2F`
- Omit the `.md` extension (Obsidian resolves it automatically)

**Examples:**

```
https://obs.gisk0.dev/Giskard/projects%2Fobsidian-redirect%2Fplan
https://obs.gisk0.dev/Giskard/artifacts%2F2026-02-22-report%2Fanalysis
```

Markdown link syntax for Telegram messages:

```markdown
[📄 plan](https://obs.gisk0.dev/Giskard/projects%2Fobsidian-redirect%2Fplan)
```

### Passthrough (arbitrary vault/action)

```
https://obs.gisk0.dev/open?vault=Giskard&file=projects%2Ffoo%2Fbar
```

Parameters are forwarded verbatim to `obsidian://open?...`.

### Health check

```
https://obs.gisk0.dev/health  →  200 "ok"
```

## UX

| Platform | Experience |
|---|---|
| **macOS Telegram** | Tap link → browser flashes → Obsidian opens (~0 friction, sub-second) |
| **iOS Telegram** | Tap link → see "Open in Obsidian" page → tap button → Obsidian opens (1 extra tap, unavoidable) |

The 1-extra-tap on iOS is a hard limit — Telegram WKWebView blocks script-initiated navigation to custom URI schemes. The button approach is the most reliable technique available without Universal Links (which Obsidian doesn't implement).

## iOS Shortcut (power user, 100% reliable)

One-time setup eliminates the HTML page entirely on iOS:

1. Open **Shortcuts** app → New Shortcut
2. Add action: **Receive** → "URLs" (from Share Sheet)
3. Add action: **Replace Text** in `Shortcut Input`
   - Find: `https://obs.gisk0.dev/`
   - Replace: `obsidian://open?`
4. Add action: **Open URLs** (the result)
5. Name it "Open in Obsidian" and enable **Show in Share Sheet**

Usage: tap link → tap "..." menu → Share → "Open in Obsidian" → Obsidian opens directly.

## Deploy

### First-time setup

```bash
# 1. Install dependencies
npm install

# 2. Authenticate with Cloudflare (opens browser, use gisk0 account)
npx wrangler login

# 3. Deploy
npm run deploy

# 4. Verify
curl https://obs.gisk0.dev/health
curl -v https://obs.gisk0.dev/Giskard/test
```

### CI/CD (GitHub Actions)

After first manual deploy, subsequent deploys happen automatically on push to `main`.

**Required GitHub secret:**

1. Go to repo **Settings → Secrets and variables → Actions**
2. Add secret: `CF_API_TOKEN`
   - Create token at: [Cloudflare Dashboard → Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Template: **Edit Cloudflare Workers**
   - Scope: Account → Workers Scripts → Edit

### Local development

```bash
npm run dev   # starts wrangler dev server at http://localhost:8787
```

## Architecture

- **Runtime:** Cloudflare Workers (TypeScript, `wrangler.toml`)
- **Route:** `obs.gisk0.dev/*` via Workers Routes (no manual DNS records needed)
- **Security:** No auth, no state, no DB. Constructs only `obsidian://open?vault=...&file=...`. XSS-safe: obsidianUrl is `JSON.stringify`'d in the script tag, never raw-interpolated into executable context.
- **Code:** `src/index.ts` — ~50 lines
