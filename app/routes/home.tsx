import { PostList } from '../components/PostList';
import type { Handle } from '../handles';
import { getAllPosts } from '../lib/posts';
import type { Route } from './+types/home';

export const handle: Handle = { classname: 'page-home' };

export async function loader() {
  const posts = await getAllPosts();
  return { posts };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { posts } = loaderData;
  return (
    <>
      <title>Hi. — KSH</title>
      <meta name="description" content="Hi. Writing is HARD!" />
      <PostList posts={posts} />
    </>
  );
}
