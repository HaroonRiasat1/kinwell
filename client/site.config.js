// The public address of the site, used in canonical links, link previews, robots.txt and the sitemap.
// Set SITE_URL when building for a custom domain.
export const SITE_URL = (process.env.SITE_URL ?? 'https://kinwell-sepia.vercel.app').replace(/\/$/, '');
