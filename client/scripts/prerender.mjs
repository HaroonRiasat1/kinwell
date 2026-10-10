// After `vite build`: writes the search-engine-facing files into dist/.
//   index.html   the homepage with its content pre-rendered and schema.org data
//   app.html     the empty app shell for signed-in areas (not indexed)
//   404.html     a real "not found" page
//   robots.txt, sitemap.xml
import { readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SITE_URL } from '../site.config.js';

const dist = (f) => fileURLToPath(new URL(`../dist/${f}`, import.meta.url));
const ssrEntry = new URL('../dist-ssr/prerender.js', import.meta.url);
const { renderHome, structuredData } = await import(ssrEntry.href);

const shell = await readFile(dist('index.html'), 'utf8');
if (!shell.includes('<!--app-->')) throw new Error('dist/index.html has no <!--app--> placeholder');

// Signed-in areas: same shell, kept out of search results.
await writeFile(dist('app.html'), shell.replace('<head>', '<head>\n    <meta name="robots" content="noindex" />').replace('<!--app-->', ''));

// Homepage: real content, structured data, and the scroll-reveal content visible without JavaScript.
const jsonLd = structuredData(SITE_URL)
  .map((d) => `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>`)
  .join('\n    ');
const noJs = '<noscript><style>.lp-reveal{opacity:1!important;transform:none!important}</style></noscript>';
await writeFile(dist('index.html'), shell.replace('</head>', `    ${jsonLd}\n    ${noJs}\n  </head>`).replace('<!--app-->', renderHome()));

await writeFile(
  dist('robots.txt'),
  `# Kinwell: the public website is open to search engines; signed-in areas are private.
User-agent: *
Allow: /
Disallow: /api/
Disallow: /family
Disallow: /parent
Disallow: /workspace
Disallow: /admin
Disallow: /join/
Disallow: /signed-out
Disallow: /design-system

Sitemap: ${SITE_URL}/sitemap.xml
`,
);

const today = new Date().toISOString().slice(0, 10);
await writeFile(
  dist('sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>
`,
);

await writeFile(
  dist('404.html'),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Page not found · Kinwell</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',system-ui,sans-serif;color:#1f2a28;
    background:radial-gradient(60% 60% at 10% 0%,#f8d2bf,transparent 60%),radial-gradient(60% 60% at 100% 100%,#c6e3da,transparent 60%),#f5f1ea}
  main{max-width:460px;padding:36px;border-radius:28px;background:rgba(255,255,255,.65);border:1px solid rgba(255,255,255,.9);box-shadow:0 20px 50px rgba(31,42,40,.1)}
  .k{width:44px;height:44px;border-radius:12px;background:#2c6e63;color:#fff;display:grid;place-items:center;font-weight:800;font-size:24px}
  h1{font-size:32px;letter-spacing:-.03em;margin:20px 0 8px}p{font-size:18px;line-height:1.5;color:#4a5856;margin:0 0 24px}
  a{display:inline-block;padding:14px 22px;border-radius:999px;background:#2c6e63;color:#fff;font-weight:700;text-decoration:none}
  @media (prefers-color-scheme: dark){body{background:#17201e;color:#eef2f0}main{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12)}p{color:#b8c4c1}}
</style>
</head>
<body>
<main>
  <div class="k" aria-hidden="true">K</div>
  <h1>We couldn't find that page</h1>
  <p>The link may be old or mistyped. Everything about Kinwell starts from the homepage.</p>
  <a href="/">Go to Kinwell</a>
</main>
</body>
</html>
`,
);

await rm(fileURLToPath(new URL('../dist-ssr', import.meta.url)), { recursive: true, force: true });
console.log(`[prerender] homepage, app shell, 404, robots.txt and sitemap.xml written for ${SITE_URL}`);
