import { getAllPosts, slugify } from '../lib/posts';
import type { Route } from './+types/home';

export const handle = { classname: 'page-home' };

export async function loader() {
  const posts = await getAllPosts();
  return { posts };
}

export function meta() {
  return [
    { title: 'Hi. — KSH' },
    { name: 'description', content: 'Hi. Writing is HARD!' },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { posts } = loaderData;
  return <PostList posts={posts} />;
}

export function PostList({
  posts,
}: {
  posts: Awaited<ReturnType<typeof getAllPosts>>;
}) {
  return (
    <ul className="post-list">
      {posts.map((post) => (
        <li key={post.url} className="post-summary lined-block row">
          <h3 className="col span_4">
            <a href={post.url}>{post.title}</a>
          </h3>
          <time className="col span_2" dateTime={post.date}>
            {post.date}
          </time>
          <div className="row">
            <div className="post-tags col span_4">
              Tags:{' '}
              {post.tags.map((tag, i) => (
                <span key={tag}>
                  <a href={`/tag/${encodeURIComponent(slugify(tag))}.html`}>
                    {tag}
                  </a>
                  {i < post.tags.length - 1 ? ', ' : ' '}
                </span>
              ))}
            </div>
            <div className="post-category col span_2">
              {post.categories.map((cat, i) => (
                <span key={cat}>
                  <a
                    href={`/category/${encodeURIComponent(slugify(cat))}.html`}
                  >
                    {cat.toUpperCase()}
                  </a>
                  {i < post.categories.length - 1 ? ', ' : ' '}
                </span>
              ))}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
