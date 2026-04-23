import { getAllPosts, slugify } from "../lib/posts";
import type { Route } from "./+types/post";

export const handle = { classname: "page-post" };

export async function loader({ params }: Route.LoaderArgs) {
  const { year, month, day, slug } = params;
  const posts = await getAllPosts();
  const post = posts.find(
    (p) =>
      p.year === year && p.month === month && p.day === day && p.slug === slug
  );
  if (!post) throw new Response("Not Found", { status: 404 });
  return { post };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data?.post) return [{ title: "Not Found — KSH" }];
  return [
    { title: `${data.post.title} — KSH` },
    { name: "description", content: data.post.oneliner ?? data.post.title },
  ];
}

export default function Post({ loaderData }: Route.ComponentProps) {
  const { post } = loaderData;
  const hasIcon = post.image?.[0]?.src != null;

  return (
    <article className="post">
      <header className="row">
        <div
          className={`title-wrap lined-block col ${hasIcon ? "span_5" : ""}`}
        >
          <h1>
            <a href={post.url}>{post.title}</a>
          </h1>
          <div className="post-meta">
            {post.date}
            {post.categories.map((cat) => (
              <span key={cat}>
                {" "}
                in{" "}
                <a href={`/category/${encodeURIComponent(slugify(cat))}.html`}>{cat}</a>
              </span>
            ))}
            <span className="inline-tags">
              {" "}
              Tags:{" "}
              {post.tags.map((tag, i) => (
                <span key={tag}>
                  <a href={`/tag/${encodeURIComponent(slugify(tag))}.html`}>{tag}</a>
                  {i < post.tags.length - 1 ? ", " : " "}
                </span>
              ))}
            </span>
          </div>
        </div>
        {hasIcon && (
          <div className="post-icon col span_1">
            <a href={post.url}>
              <img src={post.image![0].src} alt={post.image![0].alt} />
            </a>
          </div>
        )}
      </header>

      <div className="post-content row">
        <div className="lined-block col">
          {post.oneliner && (
            <aside className="col span_3">
              {post.oneliner}
              {post.projecturl && (
                <>
                  <br />
                  <a className="project-url" href={post.projecturl}>
                    {post.projecturl}
                  </a>
                </>
              )}
            </aside>
          )}
          <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
        </div>
      </div>

      {post.type !== "project" && (
        <div className="row">
          <p className="signoff lined-block col">
            &mdash;{" "}
            <a href="https://twitter.com/kirbysayshi">@KirbySaysHi</a>{" "}
            {new Date(post.date + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            })}
          </p>
        </div>
      )}

      <div className="row hn-link" />

      <div id="disqus_thread" className="lined-block" />
      <button id="load-disqus" onClick={undefined}>
        Add or View Comments (Disqus)
      </button>
      <script
        dangerouslySetInnerHTML={{
          __html: `
function loadDisqus() {
  var btn = document.querySelector('#load-disqus');
  btn.parentNode.removeChild(btn);
  var disqus_shortname = 'kirbysayshi'
    ,disqus_identifier = '//kirbysayshi.com${post.url}'
    ,disqus_developer = window.location.href.indexOf('localhost') > -1 ? 1 : 0;
  (function() {
    var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
    dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
  })();
}
document.getElementById('load-disqus').addEventListener('click', loadDisqus);
`,
        }}
      />
    </article>
  );
}
