import { getAllPosts, slugify } from '../lib/posts';
import type { Route } from './+types/tag';
import { PostList } from './home';

export const handle = { classname: 'page-home' };

export async function loader({ params }: Route.LoaderArgs) {
  const { slug } = params;
  const posts = await getAllPosts();
  const tagPosts = posts.filter((p) => p.tags.some((t) => slugify(t) === slug));
  const tagName =
    tagPosts[0]?.tags.find((t) => slugify(t) === slug) ?? slug ?? '';
  return { tagPosts, tagName };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: `Posts Tagged With ${data?.tagName} — KSH` }];
}

export default function Tag({ loaderData }: Route.ComponentProps) {
  const { tagPosts, tagName } = loaderData;
  return (
    <>
      <h1 className="lined-block col span_6">
        Showing Posts Tagged With {tagName}
      </h1>
      <PostList posts={tagPosts} />
    </>
  );
}
