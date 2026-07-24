import { getCollection } from 'astro:content';
import { site } from '../data/site';

export interface PostItem {
  title: string;
  description: string;
  date: Date;
  url: string;
  source: 'local' | 'dev.to';
  tags: string[];
}

const normalize = (t: string) => t.trim().toLowerCase();

/**
 * Combina los posts locales (src/content/blog) con los artículos de dev.to.
 * Si un artículo está publicado en ambos lados (mismo título), gana la
 * versión local para no mostrarlo duplicado.
 */
export async function getPosts(limit?: number): Promise<PostItem[]> {
  const localPosts: PostItem[] = (await getCollection('blog', ({ data }) => !data.draft)).map(
    (p) => ({
      title: p.data.title,
      description: p.data.description,
      date: p.data.pubDate,
      url: `/blog/${p.id}/`,
      source: 'local' as const,
      tags: p.data.tags,
    }),
  );

  let devToPosts: PostItem[] = [];
  if (site.devToUsername) {
    try {
      const res = await fetch(
        `https://dev.to/api/articles?username=${site.devToUsername}&per_page=30`,
        { signal: AbortSignal.timeout(4000) },
      );
      if (res.ok) {
        const articles = (await res.json()) as {
          title: string;
          description: string;
          url: string;
          published_at: string;
          tag_list?: string[];
        }[];
        devToPosts = articles.map((a) => ({
          title: a.title,
          description: a.description ?? '',
          date: new Date(a.published_at),
          url: a.url,
          source: 'dev.to' as const,
          tags: a.tag_list ?? [],
        }));
      }
    } catch {
      // Build sin conexión o dev.to caído: se muestra solo el contenido local
    }
  }

  const localTitles = new Set(localPosts.map((p) => normalize(p.title)));
  const merged = [
    ...localPosts,
    ...devToPosts.filter((p) => !localTitles.has(normalize(p.title))),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return limit ? merged.slice(0, limit) : merged;
}

export const fmtDate = (d: Date) =>
  d.toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: '2-digit' });
