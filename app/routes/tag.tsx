import { PostList } from '../components/PostList';
import type { Handle } from '../handles';
import { getPostsByTagSlug } from '../lib/posts';
import type { Route } from './+types/tag';

export const handle: Handle = { classname: 'page-home' };

export async function loader({ params }: Route.LoaderArgs) {
  const { slug } = params;
  return await getPostsByTagSlug(slug);
}

export default function Tag({ loaderData }: Route.ComponentProps) {
  const { posts, info } = loaderData;
  return (
    <>
      <title>{`Posts Tagged With ${info.name} — KSH`}</title>
      <h1 className="lined-block col span_6">
        Showing Posts Tagged With {info.name}
      </h1>
      <PostList posts={posts} />
    </>
  );
}
