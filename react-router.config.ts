import type { Config } from '@react-router/dev/config';

import { getAllCats, getAllPosts, getAllTags } from './app/lib/posts';

export default {
  async prerender() {
    return [
      '/',
      '/feed.xml',
      '/404.html',
      ...(await getAllPosts()).flatMap((p) => p.permalinks),
      ...Array.from(getAllTags().values()).map((t) => t.url),
      ...Array.from(getAllCats().values()).map((c) => c.url),
    ];
  },
} satisfies Config;
