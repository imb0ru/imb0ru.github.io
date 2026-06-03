import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

function remarkReadingTime() {
  return function (tree, file) {
    const words = collectText(tree).trim().split(/\s+/).filter(Boolean).length;
    file.data.astro.frontmatter.minutesRead = Math.max(1, Math.round(words / 200));
    file.data.astro.frontmatter.words = words;
  };
}

function collectText(node) {
  if (typeof node.value === 'string') return node.value;
  if (Array.isArray(node.children)) return node.children.map(collectText).join(' ');
  return '';
}

export default defineConfig({
  site: 'https://imb0ru.github.io',
  base: '/',
  trailingSlash: 'ignore',
  integrations: [mdx(), sitemap()],
  markdown: {
    remarkPlugins: [remarkReadingTime],
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: false,
    },
  },
});
