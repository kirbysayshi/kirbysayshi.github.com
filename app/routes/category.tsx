import { PostList } from '../components/PostList';
import type { Handle } from '../handles';
import { getPostsByCategorySlug } from '../lib/posts';
import type { Route } from './+types/category';

export const handle: Handle = { classname: 'page-home' };

export async function loader({ params }: Route.LoaderArgs) {
  const { slug } = params;
  return await getPostsByCategorySlug(slug);
}

export default function Category({ loaderData }: Route.ComponentProps) {
  const { posts, info } = loaderData;
  return (
    <>
      <title>{`Posts in ${info.name} — KSH`}</title>
      <h1 className="lined-block col span_6">Showing Posts in {info.name}</h1>
      <PostList posts={posts} />
    </>
  );
}
