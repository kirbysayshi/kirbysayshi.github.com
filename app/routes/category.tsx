import { getAllPosts, slugify } from '../lib/posts';
import type { Route } from './+types/category';
import { PostList } from './home';

export const handle = { classname: 'page-home' };

const posts = await getAllPosts();

export function loader({ params }: Route.LoaderArgs) {
  return { slug: params.slug };
}

export default function Category({ loaderData }: Route.ComponentProps) {
  const { slug } = loaderData;
  const catPosts = posts.filter((p) =>
    p.categories.some((c) => slugify(c) === slug),
  );
  const catName =
    catPosts[0]?.categories.find((c) => slugify(c) === slug) ?? slug;
  return (
    <>
      <title>Posts in {catName} — KSH</title>
      <h1 className="lined-block col span_6">Showing Posts in {catName}</h1>
      <PostList posts={catPosts} />
    </>
  );
}
