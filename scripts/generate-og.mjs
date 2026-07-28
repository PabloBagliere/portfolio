// Genera las imágenes Open Graph (1200x630) de los posts del blog en public/og/.
// Uso: pnpm og            → regenera todas
//      pnpm og <slug>     → regenera solo esa
// Corre local (satori + sharp); el PNG queda commiteado y Cloudflare lo sirve estático.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

const ROOT = new URL('..', import.meta.url).pathname;
const BLOG_DIR = join(ROOT, 'src/content/blog');
const OUT_DIR = join(ROOT, 'public/og');
const SITE_URL = 'pablobagliere.dev';

const only = process.argv[2];

// --- frontmatter mínimo (title, pubDate, tags) ---
const field = (fm, key) => {
  const m = fm.match(new RegExp(`^${key}:\\s*['"]?(.+?)['"]?\\s*$`, 'm'));
  return m?.[1] ?? '';
};
const parsePost = (file) => {
  const raw = readFileSync(join(BLOG_DIR, file), 'utf8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const tagsRaw = fm.match(/^tags:\s*\[(.+?)\]/m)?.[1] ?? '';
  return {
    slug: file.replace(/\.md$/, ''),
    title: field(fm, 'title'),
    pubDate: field(fm, 'pubDate'),
    tags: tagsRaw ? tagsRaw.split(',').map((t) => t.trim().replace(/['"]/g, '')) : [],
  };
};

// --- fuentes (woff: el formato que satori entiende) ---
const fontFile = (f) =>
  readFileSync(join(ROOT, 'node_modules/@fontsource/jetbrains-mono/files', f));
const fonts = [
  { name: 'JetBrains Mono', weight: 400, data: fontFile('jetbrains-mono-latin-400-normal.woff') },
  { name: 'JetBrains Mono', weight: 700, data: fontFile('jetbrains-mono-latin-700-normal.woff') },
];

// --- paleta del sitio (src/styles/global.css) ---
const C = {
  bg: '#0a0e14',
  panel: '#10151d',
  panel2: '#151c26',
  border: '#1f2937',
  dim: '#67707e',
  green: '#3fd68c',
  cyan: '#54c8dc',
  amber: '#e5b567',
  red: '#e46876',
};

const fmtDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

const titleSize = (t) => (t.length > 60 ? 40 : t.length > 42 ? 48 : 56);

// árbol estilo React.createElement (satori no necesita React)
const h = (type, props, ...children) => ({
  type,
  props: { ...props, children: children.length > 1 ? children : children[0] },
});

const ogImage = ({ slug, title, pubDate, tags }) =>
  h(
    'div',
    {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: C.bg,
        padding: 48,
        fontFamily: 'JetBrains Mono',
      },
    },
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          backgroundColor: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          overflow: 'hidden',
        },
      },
      // barra de la ventana con los tres puntitos
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 20px',
            backgroundColor: C.panel2,
            borderBottom: `1px solid ${C.border}`,
          },
        },
        h('div', { style: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.red } }),
        h('div', { style: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.amber } }),
        h('div', { style: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.green } }),
        h(
          'div',
          { style: { marginLeft: 12, color: C.dim, fontSize: 18 } },
          `pablo@bagliere: ~/posts/${slug}.md`,
        ),
      ),
      // cuerpo
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'space-between',
            padding: '40px 48px',
          },
        },
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column' } },
          h(
            'div',
            { style: { color: C.dim, fontSize: 22, marginBottom: 24 } },
            `$ cat ~/posts/${slug}.md`,
          ),
          h(
            'div',
            {
              style: {
                color: C.green,
                fontSize: titleSize(title),
                fontWeight: 700,
                lineHeight: 1.25,
                textShadow: `0 0 10px rgba(63, 214, 140, 0.5)`,
              },
            },
            title,
          ),
        ),
        h(
          'div',
          { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' } },
          h(
            'div',
            { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
            h(
              'div',
              { style: { color: C.dim, fontSize: 20 } },
              `${fmtDate(pubDate)}${tags.length ? `  ·  ${tags.map((t) => `#${t}`).join(' ')}` : ''}`,
            ),
            h('div', { style: { color: C.cyan, fontSize: 22 } }, `${SITE_URL}/blog/${slug}/`),
          ),
          h('div', { style: { width: 14, height: 26, backgroundColor: C.green } }),
        ),
      ),
    ),
  );

// --- main ---
mkdirSync(OUT_DIR, { recursive: true });

const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
const targets = only ? files.filter((f) => f.startsWith(only)) : files;

if (targets.length === 0) {
  console.error(`No encontré ningún post que matchee "${only}"`);
  process.exit(1);
}

for (const file of targets) {
  const post = parsePost(file);
  const svg = await satori(ogImage(post), { width: 1200, height: 630, fonts });
  const out = join(OUT_DIR, `${post.slug}.png`);
  writeFileSync(out, await sharp(Buffer.from(svg)).png().toBuffer());
  console.log(`✓ public/og/${post.slug}.png`);
}
