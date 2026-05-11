import { getPostsByTagSlug } from '../lib/posts';
import type { Route } from './+types/tag';
import { PostList } from './home';

export const handle = { classname: 'page-home' };

export async function loader({ params }: Route.LoaderArgs) {
  const { slug } = params;
  return await getPostsByTagSlug(slug);
}

export default function Tag({ loaderData }: Route.ComponentProps) {
  const { tagPosts, tagName } = loaderData;
  return (
    <>
      <title>{`Posts Tagged With ${tagName} — KSH`}</title>
      <h1 className="lined-block col span_6">
        Showing Posts Tagged With {tagName}
      </h1>
      <PostList posts={tagPosts} />
    </>
  );
}
