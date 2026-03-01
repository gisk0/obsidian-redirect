import { marked } from "marked";

export interface Env {
  PUBLISHED_NOTES: KVNamespace;
  PUBLISH_TOKEN: string;
}

interface NoteRecord {
  title: string;
  markdown: string;
  publishedAt: string;
  updatedAt: string;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html { font-size: 18px; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Georgia, serif;
    background: #fafaf9;
    color: #1c1c1c;
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
    line-height: 1.75;
  }
  header { margin-bottom: 2.5rem; border-bottom: 1px solid #e5e5e5; padding-bottom: 1.5rem; }
  header h1 { font-size: 2rem; font-weight: 700; margin: 0 0 0.4rem; line-height: 1.25; }
  header .meta { color: #6b6b6b; font-size: 0.875rem; }
  article h1, article h2, article h3, article h4, article h5, article h6 {
    margin: 1.8rem 0 0.6rem; font-weight: 600; line-height: 1.3;
  }
  article h1 { font-size: 1.75rem; }
  article h2 { font-size: 1.4rem; }
  article h3 { font-size: 1.15rem; }
  article p { margin: 0 0 1rem; }
  article a { color: #7c3aed; text-decoration: underline; }
  article a:hover { color: #6d28d9; }
  article ul, article ol { margin: 0 0 1rem 1.5rem; }
  article li { margin-bottom: 0.25rem; }
  article blockquote {
    border-left: 4px solid #d4d4d4;
    margin: 1rem 0;
    padding: 0.25rem 1rem;
    color: #555;
    font-style: italic;
  }
  article code {
    background: #f0efe9;
    padding: 0.15em 0.4em;
    border-radius: 4px;
    font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
    font-size: 0.875em;
  }
  article pre {
    background: #1e1e2e;
    color: #cdd6f4;
    border-radius: 8px;
    padding: 1.25rem;
    overflow-x: auto;
    margin: 1rem 0;
  }
  article pre code {
    background: none;
    padding: 0;
    color: inherit;
    font-size: 0.875rem;
  }
  article table {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
    font-size: 0.9rem;
  }
  article th, article td {
    border: 1px solid #e5e5e5;
    padding: 0.5rem 0.75rem;
    text-align: left;
  }
  article th { background: #f0efe9; font-weight: 600; }
  article img { max-width: 100%; border-radius: 6px; }
  article hr { border: none; border-top: 1px solid #e5e5e5; margin: 2rem 0; }
  footer {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e5e5;
    text-align: center;
    color: #9ca3af;
    font-size: 0.8rem;
  }
  @media (max-width: 600px) {
    body { padding: 1.25rem 1rem 3rem; }
    header h1 { font-size: 1.5rem; }
  }
`;

// ─── HTML Templates ────────────────────────────────────────────────────────────

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function notePage(title: string, dateStr: string, body: string): string {
  const date = new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escHtml(title)}</title>
  <style>${CSS}</style>
</head>
<body>
  <header>
    <h1>${escHtml(title)}</h1>
    <div class="meta">Published ${date}</div>
  </header>
  <article>${body}</article>
  <footer>Shared via Giskard 🔮</footer>
</body>
</html>`;
}

function page404(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Not Found</title>
  <style>${CSS}
    .center { text-align: center; padding: 4rem 0; }
    .center h1 { font-size: 4rem; margin-bottom: 0.5rem; color: #d4d4d4; }
    .center p { color: #6b6b6b; }
  </style>
</head>
<body>
  <div class="center">
    <h1>404</h1>
    <p>This note doesn't exist or hasn't been published.</p>
  </div>
  <footer>Shared via Giskard 🔮</footer>
</body>
</html>`;
}

// ─── Obsidian Redirect (original) ─────────────────────────────────────────────

const obsidianRedirectPage = (obsidianUrl: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Opening in Obsidian…</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #1e1e2e; color: #cdd6f4;
      min-height: 100vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 16px; padding: 24px;
      text-align: center;
    }
    h1 { font-size: 1.25rem; font-weight: 600; }
    p { color: #a6adc8; font-size: 0.9rem; }
    a {
      background: #7c3aed; color: #fff;
      padding: 14px 28px; border-radius: 10px;
      text-decoration: none; font-size: 1rem; font-weight: 600;
      margin-top: 8px; display: inline-block;
    }
    a:hover { background: #6d28d9; }
  </style>
</head>
<body>
  <h1>📝 Opening in Obsidian…</h1>
  <p>Tap the button if Obsidian doesn't open automatically.</p>
  <a href="${obsidianUrl}">Open in Obsidian →</a>
  <script>
    try { window.location.href = ${JSON.stringify(obsidianUrl)}; } catch (e) {}
  </script>
</body>
</html>`;

// ─── API Helpers ──────────────────────────────────────────────────────────────

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function checkToken(req: Request, env: Env): boolean {
  return req.headers.get("X-Publish-Token") === env.PUBLISH_TOKEN;
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

async function handlePublicNote(slug: string, env: Env): Promise<Response> {
  const raw = await env.PUBLISHED_NOTES.get(slug);
  if (!raw) {
    return new Response(page404(), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  const note: NoteRecord = JSON.parse(raw);
  const html = await marked(note.markdown, { async: true });
  return new Response(notePage(note.title, note.publishedAt, html), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

async function handlePutPublish(req: Request, env: Env): Promise<Response> {
  if (!checkToken(req, env)) return unauthorized();
  const body = await req.json<{ slug: string; title: string; markdown: string }>();
  if (!body.slug || !body.title || !body.markdown) {
    return json({ error: "slug, title, and markdown are required" }, 400);
  }
  const existing = await env.PUBLISHED_NOTES.get(body.slug);
  const now = new Date().toISOString();
  const record: NoteRecord = {
    title: body.title,
    markdown: body.markdown,
    publishedAt: existing ? (JSON.parse(existing) as NoteRecord).publishedAt : now,
    updatedAt: now,
  };
  await env.PUBLISHED_NOTES.put(body.slug, JSON.stringify(record));
  return json({ ok: true, slug: body.slug, url: `/s/${body.slug}` });
}

async function handleDeletePublish(slug: string, req: Request, env: Env): Promise<Response> {
  if (!checkToken(req, env)) return unauthorized();
  await env.PUBLISHED_NOTES.delete(slug);
  return json({ ok: true, slug });
}

async function handleListPublished(req: Request, env: Env): Promise<Response> {
  if (!checkToken(req, env)) return unauthorized();
  const list = await env.PUBLISHED_NOTES.list();
  const results = await Promise.all(
    list.keys.map(async (k) => {
      const raw = await env.PUBLISHED_NOTES.get(k.name);
      if (!raw) return null;
      const note: NoteRecord = JSON.parse(raw);
      return {
        slug: k.name,
        title: note.title,
        publishedAt: note.publishedAt,
        updatedAt: note.updatedAt,
      };
    })
  );
  return json({ notes: results.filter(Boolean) });
}

// ─── Main Fetch ───────────────────────────────────────────────────────────────

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const { pathname } = url;

    // Health check
    if (pathname === "/health") {
      return new Response("ok", { headers: { "Content-Type": "text/plain" } });
    }

    // Public note view: GET /s/<slug>
    const shareMatch = pathname.match(/^\/s\/([^/]+)$/);
    if (shareMatch && req.method === "GET") {
      return handlePublicNote(shareMatch[1], env);
    }

    // Management API
    if (pathname === "/api/publish" && req.method === "PUT") {
      return handlePutPublish(req, env);
    }
    const deleteMatch = pathname.match(/^\/api\/publish\/([^/]+)$/);
    if (deleteMatch && req.method === "DELETE") {
      return handleDeletePublish(deleteMatch[1], req, env);
    }
    if (pathname === "/api/published" && req.method === "GET") {
      return handleListPublished(req, env);
    }

    // Obsidian redirect: /open?vault=X&file=Y
    if (pathname === "/open") {
      const obsidianUrl = `obsidian://open${url.search}`;
      return new Response(obsidianRedirectPage(obsidianUrl), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Obsidian redirect: /VaultName/path%2Fto%2Ffile
    const vaultMatch = pathname.match(/^\/([^/]+)\/(.+)$/);
    if (vaultMatch) {
      const [, vault, file] = vaultMatch;
      const obsidianUrl = `obsidian://open?vault=${encodeURIComponent(vault)}&file=${file}`;
      return new Response(obsidianRedirectPage(obsidianUrl), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response(
      "Usage: /VaultName/path%2Fto%2Ffile  or  /open?vault=X&file=Y  or  /s/<slug>",
      { status: 400, headers: { "Content-Type": "text/plain" } }
    );
  },
};
