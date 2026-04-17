import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
// Note: @astrojs/sitemap 3.2.x crashes against Astro 4.16 (`routes.reduce`).
// We ship a hand-written sitemap.xml in /public instead — small site, known
// routes, less moving machinery.

// https://astro.build/config
export default defineConfig({
  site: 'https://lovelywisdom.com',
  integrations: [
    tailwind({ applyBaseStyles: false }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});
