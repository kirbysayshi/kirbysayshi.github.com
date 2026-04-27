import type { Config } from '@react-router/dev/config';

import { getAllPosts, slugify } from './app/lib/posts';

export default {
  async prerender() {
    const posts = await getAllPosts(true);
    const tags = [...new Set(posts.flatMap((p) => p.tags))];
    const categories = [...new Set(posts.flatMap((p) => p.categories))];

    return [
      '/',
      '/feed.xml',
      '/404.html',
      ...posts.map((p) => p.url),
      ...tags.map((t) => `/tag/${encodeURIComponent(slugify(t))}.html`),
      ...categories.map(
        (c) => `/category/${encodeURIComponent(slugify(c))}.html`,
      ),
    ];
  },
} satisfies Config;
