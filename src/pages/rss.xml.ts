import rss from '@astrojs/rss';
import { site } from '../data/site';
import { getPosts } from '../lib/posts';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: 'Blog — Pablo Bagliere',
    description: site.description,
    site: context.site ?? site.url,
    items: posts.map((p) => ({
      title: p.title,
      description: p.description,
      pubDate: p.date,
      link: p.url,
    })),
  });
}
