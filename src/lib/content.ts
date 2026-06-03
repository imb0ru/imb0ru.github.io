import { getCollection } from 'astro:content';
import { SECTIONS, type Section } from '../consts';

const includeDrafts = import.meta.env.DEV;

export async function getEntries(section: Section) {
  const all = await getCollection(section, ({ data }) => includeDrafts || !data.draft);
  return all.sort(
    (a, b) => new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime()
  );
}

export async function getAllEntries() {
  const groups = await Promise.all(
    SECTIONS.map(async (section) => (await getEntries(section)).map((entry) => ({ section, entry })))
  );
  return groups
    .flat()
    .sort(
      (a, b) => new Date(b.entry.data.pubDate).getTime() - new Date(a.entry.data.pubDate).getTime()
    );
}
