# obsidian-redirect

HTTPS → `obsidian://` redirect service. Deploy on Cloudflare Workers to make Obsidian vault links clickable in Telegram, Discord, Slack, and any chat app that only hyperlinks `http(s)://` URLs.

## Quick Start

Get your own instance running in ~5 minutes:

1. **Fork** [gisk0/obsidian-redirect](https://github.com/gisk0/obsidian-redirect)

2. **Configure your domain** — edit `wrangler.toml`:
   ```toml
   routes = [
     { pattern = "obs.yourdomain.com/*", zone_name = "yourdomain.com" }
   ]
   ```

3. **Deploy:**
   ```bash
   npm install
   npx wrangler login        # authenticate with Cloudflare
   npm run deploy
   ```

4. **Verify:**
   ```bash
   curl https://obs.yourdomain.com/health   # → 200 "ok"
   ```

### CI/CD (optional)

After the first manual deploy, pushes to `main` auto-deploy via GitHub Actions.

Add one GitHub secret: **`CF_API_TOKEN`**
- Create at [Cloudflare → Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
- Template: **Edit Cloudflare Workers**
- Scope: Account → Workers Scripts → Edit

## Usage

### URL format

```
https://obs.yourdomain.com/<VaultName>/<encoded-file-path>
```

- Encode `/` in the file path as `%2F`
- Omit the `.md` extension (Obsidian resolves it)

**Examples:**

```
https://obs.yourdomain.com/MyVault/projects%2Fmy-project%2Fplan
https://obs.yourdomain.com/MyVault/notes%2F2026-02-22-meeting
```

### Markdown syntax (for chat apps)

```markdown
[📄 plan](https://obs.yourdomain.com/MyVault/projects%2Fmy-project%2Fplan)
```

### Passthrough (arbitrary parameters)

```
https://obs.yourdomain.com/open?vault=MyVault&file=path%2Fto%2Fnote
```

Parameters are forwarded verbatim to `obsidian://open?...`.

### Health check

```
GET /health  →  200 "ok"
```

## How It Works

**The problem:** Chat apps like Telegram only hyperlink `http://` and `https://` URLs — `obsidian://` URIs render as plain text. Worse, Telegram's iOS in-app browser (WKWebView) blocks script-initiated navigation to custom URI schemes, so even a server-side 302 redirect silently fails on iOS.

**The solution:** A Cloudflare Worker serves an HTML page with:

- A **"Open in Obsidian →" button** — user-initiated taps pass WKWebView's security checks (iOS)
- A **JS auto-redirect** — fires immediately on macOS/desktop browsers for zero-friction UX

| Platform | Experience |
|---|---|
| **macOS** | Click link → browser flashes → Obsidian opens instantly |
| **iOS** | Tap link → see "Open in Obsidian" page → tap button → Obsidian opens |

The extra tap on iOS is unavoidable — it's a WKWebView security constraint. The button approach is the most reliable method available (Obsidian doesn't support Universal Links).

## Configuration

### `wrangler.toml`

```toml
name = "obsidian-redirect"
main = "src/index.ts"
compatibility_date = "2024-01-01"

routes = [
  { pattern = "obs.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

The Workers Route automatically creates the necessary DNS records — no manual DNS configuration needed.

### Custom domain requirements

- Domain must be on Cloudflare (proxied through their nameservers)
- The `zone_name` must match your Cloudflare zone

## Local Development

```bash
npm run dev   # starts wrangler dev server at http://localhost:8787
```

## iOS Shortcut (Power User Tip)

Bypass the HTML page entirely on iOS with a one-time Shortcuts setup:

1. **Shortcuts** app → New Shortcut
2. Add action: **Receive** → "URLs" (from Share Sheet)
3. Add action: **Replace Text** in `Shortcut Input`
   - Find: `https://obs.yourdomain.com/`
   - Replace: `obsidian://open?`
4. Add action: **Open URLs**
5. Name it "Open in Obsidian", enable **Show in Share Sheet**

Then: tap link → share menu → "Open in Obsidian" → Obsidian opens directly. Zero extra pages.

## Architecture

- **Runtime:** Cloudflare Workers (TypeScript)
- **Code:** `src/index.ts` — ~50 lines
- **Security:** No auth, no state, no database. Constructs only `obsidian://open?vault=...&file=...` URLs. XSS-safe via `JSON.stringify` escaping.
- **Routing:** Workers Routes (subdomain pattern → Worker)
