import type { Config } from '@react-router/dev/config';

import { getAllCats, getAllPosts, getAllTags } from './app/lib/posts';

export default {
  async prerender() {
    const posts = await getAllPosts();

    const tags = Array.from(getAllTags().keys()).map(
      (t) => `/tag/${encodeURIComponent(t)}.html`,
    );

    const cats = Array.from(getAllCats().keys()).map(
      (c) => `/category/${encodeURIComponent(c)}.html`,
    );

    return [
      '/',
      '/feed.xml',
      '/404.html',
      ...posts.flatMap((p) => p.permalinks),
      ...tags,
      ...cats,
    ];
  },
} satisfies Config;
