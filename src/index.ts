const HTML = (obsidianUrl: string) => `<!DOCTYPE html>
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
    // Works in real browsers (macOS desktop); often blocked in Telegram WKWebView.
    // Button above is the reliable fallback for iOS.
    try { window.location.href = ${JSON.stringify(obsidianUrl)}; } catch (e) {}
  </script>
</body>
</html>`;

export default {
  fetch(req: Request): Response {
    const url = new URL(req.url);

    // Health check
    if (url.pathname === "/health") {
      return new Response("ok", { headers: { "Content-Type": "text/plain" } });
    }

    let obsidianUrl: string;

    // Passthrough mode: /open?vault=X&file=Y → obsidian://open?vault=X&file=Y
    if (url.pathname === "/open") {
      obsidianUrl = `obsidian://open${url.search}`;
    } else {
      // Shorthand mode: /<vault>/<file-path> → obsidian://open?vault=<vault>&file=<file-path>
      const match = url.pathname.match(/^\/([^/]+)\/(.+)$/);
      if (!match) {
        return new Response(
          "Usage: /VaultName/path%2Fto%2Ffile  or  /open?vault=X&file=Y",
          { status: 400, headers: { "Content-Type": "text/plain" } }
        );
      }
      const [, vault, file] = match;
      obsidianUrl = `obsidian://open?vault=${encodeURIComponent(vault)}&file=${file}`;
    }

    return new Response(HTML(obsidianUrl), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
};
