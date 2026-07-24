// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Cambiar por tu dominio real (también en src/data/site.ts)
  site: 'https://pablobagliere.dev',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
