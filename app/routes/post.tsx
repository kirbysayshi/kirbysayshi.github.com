import { getAllPosts } from '../lib/posts';
import type { Route } from './+types/post';

export const handle = { classname: 'page-post' };

export async function loader({ request }: Route.LoaderArgs) {
  const { pathname } = new URL(request.url);
  const posts = await getAllPosts();
  const post = posts.find((p) => p.permalinks.includes(pathname));
  if (!post) throw new Response('Not Found', { status: 404 });
  return { post };
}

export default function Post({ loaderData }: Route.ComponentProps) {
  const { post } = loaderData;

  // Super old, only a few old posts have this.
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const image = post.image[0];

  const cats = post.categories.map((cat, i) => (
    <span key={cat.slug}>
      {' '}
      <a href={cat.url}>{cat.name}</a>
      {i < post.categories.length - 1 ? ', ' : ' '}
    </span>
  ));

  return (
    <article className="post">
      <title>{`${post.title} — KSH`}</title>
      <link rel="canonical" href={`https://kirbysayshi.com${post.url}`} />
      <meta name="description" content={post.oneliner ?? post.title} />
      <header className="row">
        <div className={`title-wrap lined-block col ${image ? 'span_5' : ''}`}>
          <h1>
            <a href={post.url}>{post.title}</a>
          </h1>
          <div className="post-meta">
            {post.date} {cats.length && 'in'}
            {cats}
            <div className="inline-tags">
              {' '}
              Tags:{' '}
              {post.tags.map((tag, i) => (
                <span key={tag.slug}>
                  <a href={tag.url}>{tag.name}</a>
                  {i < post.tags.length - 1 ? ', ' : ' '}
                </span>
              ))}
            </div>
          </div>
        </div>
        {image && (
          <div className="post-icon col span_1">
            <a href={post.url}>
              <img src={image.src} alt={image.alt} />
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
                  <ExplodedPostUrl url={post.projecturl} />
                </>
              )}
            </aside>
          )}
          <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
        </div>
      </div>

      <div className="row hn-link" />

      <div id="disqus_thread" className="lined-block" />
      <button id="load-disqus" onClick={undefined}>
        Add or View Comments (Disqus)
      </button>
      <script
        dangerouslySetInnerHTML={{
          __html: DISQUS_SNIPPET(post.url),
        }}
      />
    </article>
  );
}

const DISQUS_SNIPPET = (url: string) => `
function loadDisqus() {
  var btn = document.querySelector('#load-disqus');
  btn.parentNode.removeChild(btn);
  var disqus_shortname = 'kirbysayshi'
    ,disqus_identifier = '//kirbysayshi.com${url}'
    ,disqus_developer = window.location.href.indexOf('localhost') > -1 ? 1 : 0;
  (function() {
    var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
    dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
  })();
}
document.getElementById('load-disqus').addEventListener('click', loadDisqus);
`;

function ExplodedPostUrl(props: { url?: string }) {
  if (!props.url) return null;

  let url;

  try {
    // projecturl might not be a url, might just be a path, etc
    url = new URL(props.url);
  } catch (_err) {
    return (
      <a className="project-url" href={props.url}>
        {props.url}
      </a>
    );
  }

  const toShow = ['protocol', 'hostname', 'port', 'pathname'] as (keyof URL)[];
  const parts = [];

  for (const part of toShow) {
    const value = url[part];
    if (value === '' || typeof value !== 'string') continue;
    parts.push(
      <span key={part} className="exploded-url">
        <span className="exploded-url-part">[{part}]</span>
        <span className="exploded-url-value">{value}</span>
      </span>,
    );
  }

  return (
    <a className="project-url" href={props.url}>
      {parts}
    </a>
  );
}
