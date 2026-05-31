import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://abelteame.dev',
  integrations: [sitemap()],
  build: {
    format: 'directory',
  },
});
