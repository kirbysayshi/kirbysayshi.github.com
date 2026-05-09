import { index, route, type RouteConfig } from '@react-router/dev/routes';

import { getAllPosts } from './lib/posts';

const posts = await getAllPosts();

export default [
  index('routes/home.tsx'),
  ...posts.flatMap((p) =>
    p.permalinks.map((l) => route(l, 'routes/post.tsx', { id: l })),
  ),
  route('tag/:slug.html', 'routes/tag.tsx'),
  route('category/:slug.html', 'routes/category.tsx'),
  route('feed.xml', 'routes/feed.xml.tsx'),
  route('404.html', 'routes/404.tsx'),
] satisfies RouteConfig;
