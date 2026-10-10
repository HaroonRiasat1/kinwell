import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { SITE_URL } from './site.config.js';

/** Fills __SITE_URL__ in index.html (dev and build). */
const siteUrl = () => ({
  name: 'kinwell-site-url',
  transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', SITE_URL),
});

export default defineConfig({
  plugins: [react(), siteUrl()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4000' },
    fs: { allow: ['..'] }, // the shared workspace lives one level up
  },
});
