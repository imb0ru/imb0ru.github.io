import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE, SECTIONS } from '../consts';
import { withBase } from '../lib/url';

export async function GET(context: APIContext) {
  const items = [];
  for (const section of SECTIONS) {
    const entries = await getCollection(section, ({ data }) => !data.draft);
    for (const entry of entries) {
      items.push({
        title: entry.data.title,
        description: entry.data.description,
        pubDate: new Date(entry.data.pubDate),
        link: withBase(`/blog/${section}/${entry.id}`),
        categories: entry.data.tags,
      });
    }
  }

  items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: `${SITE.author} · DFIR & Forensic CTF`,
    description: 'Research, forensic CTF writeups, and challenges by Marco Ferrara (imb0ru).',
    site: context.site ?? 'https://imb0ru.github.io',
    items,
    customData: `<language>en</language>`,
  });
}
