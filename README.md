# Portfolio — Pablo Bagliere

Portfolio personal con estética de **terminal interactiva**, construido con **Astro** (sitio
100% estático) y **Tailwind CSS v4**. Incluye una shell funcional en el hero con comandos
ejecutables (`help`, `projects`, `sudo hire pablo`...), secciones renderizadas como salidas de
comandos Unix, navegación estilo tmux y barra de estado estilo vim.

## Comandos

```bash
npm run dev       # desarrollo en http://localhost:4321
npm run build     # build de producción → dist/
npm run preview   # preview local del build
npm run deploy    # build + deploy a Cloudflare Workers (wrangler)
```

## Estructura

```
src/
├── data/cv.ts          # ← TODA la info del CV (editar acá)
├── data/site.ts        # ← dominio, email, redes, usuario de dev.to
├── lib/posts.ts        # combina posts locales + dev.to (con deduplicación)
├── components/         # Terminal, secciones, Nav, StatusLine...
├── pages/              # index, blog, 404, rss.xml
├── content/blog/       # posts en Markdown
└── styles/global.css   # tema (colores de la terminal)

public/
└── Pablo_Bagliere_cv.pdf  # se descarga desde el botón de contacto o el comando `cv`
```

## Blog

Hay dos fuentes de artículos que se combinan automáticamente (la lógica vive en
`src/lib/posts.ts`):

1. **Posts locales**: archivos `.md` en `src/content/blog/`. Hay un ejemplo con `draft: true`
   (los drafts no se publican). Para escribir uno nuevo, copialo, cambiá el frontmatter y poné
   `draft: false`.
2. **dev.to**: si `devToUsername` está configurado en `src/data/site.ts`, los artículos
   publicados se traen en build time y se listan con badge `dev.to`. Dejalo vacío (`''`)
   para desactivarlo.

Podés escribir en **ambos lados a la vez**: si un artículo existe con el mismo título en
dev.to y en el blog local, se muestra una sola vez (gana la versión local).

- **RSS** (`/rss.xml`): incluye los posts locales **y** los de dev.to, así el feed crece
  aunque publiques solo en dev.to.
- **Sitemap** (`/sitemap-index.xml`): se regenera en cada build e incluye automáticamente
  cualquier página o post local nuevo.

## Deploy en Cloudflare

### Opción A — Cloudflare Pages (recomendada, la más simple)

1. Subí el repo a GitHub.
2. En el dashboard de Cloudflare → **Workers & Pages** → **Create** → pestaña **Pages** →
   conectá el repo.
3. Configuración de build:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy. Cada push a `main` redeploya solo.

### Opción B — Workers (static assets, con wrangler)

Ya hay un `wrangler.jsonc` configurado:

```bash
npx wrangler login
npm run deploy
```

## Personalización pendiente

- **Dominio**: cambiar `https://pablobagliere.dev` en `astro.config.mjs`, `src/data/site.ts`
  y `public/robots.txt` por el dominio real (afecta canonical, sitemap, RSS y OG tags).
