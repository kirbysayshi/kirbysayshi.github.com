import type { EleventySuppliedData } from "11ty.ts";
import { InlineTags } from "./InlineTags.tsx";

export type PostItem = EleventySuppliedData & {
  url: string; // narrows EleventySuppliedData's string | false
  data: {
    title: string;
    categories?: string[];
    tags?: string[];
  };
};

interface PostListProps {
  posts: PostItem[];
}

function isoDate(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function PostList({ posts }: PostListProps) {
  return (
    <ul className="post-list">
      {posts.map((post) => (
        <li key={post.url} className="post-summary lined-block row">
          <h3 className="col span_4">
            <a href={post.url}>{post.data.title}</a>
          </h3>
          <time className="col span_2" dateTime={isoDate(post.date)}>
            {isoDate(post.date)}
          </time>
          <div className="row">
            <div className="post-tags col span_4">
              <InlineTags tags={post.data.tags} />
            </div>
            <div className="post-category col span_2">
              {(post.data.categories ?? []).map((cat, i, arr) => (
                <span key={cat}>
                  <a href={`/category/${cat.toLowerCase().replace(/ /g, "-")}.html`}>
                    {cat.toUpperCase()}
                  </a>
                  {i < arr.length - 1 ? ", " : ""}
                </span>
              ))}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
