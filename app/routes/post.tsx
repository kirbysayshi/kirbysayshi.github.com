import { useMemo } from 'react';

import { getAllPosts, slugify } from '../lib/posts';
import type { Route } from './+types/post';

export const handle = { classname: 'page-post' };

export async function loader({ params }: Route.LoaderArgs) {
  const { slug } = params;
  const posts = await getAllPosts();
  const post = posts.find((p) => p.slug === slug);
  if (!post) throw new Response('Not Found', { status: 404 });
  return { post };
}

export default function Post({ loaderData }: Route.ComponentProps) {
  const { post } = loaderData;

  // Super old, only a few old posts have this.
  const hasIcon = !!post.image[0]?.src;

  const categoriesList = useMemo(() => {
    const fmt = new Intl.ListFormat();
    const cmp = [];
    for (const cat of fmt.formatToParts(post.categories)) {
      cmp.push(
        cat.type === 'literal' ? (
          cat.value
        ) : (
          <span key={cat.value}>
            {' '}
            <a
              href={`/category/${encodeURIComponent(slugify(cat.value))}.html`}
            >
              {cat.value}
            </a>
          </span>
        ),
      );
    }
    return cmp;
  }, []);

  return (
    <article className="post">
      <title>{`${post.title} — KSH`}</title>
      <meta name="description" content={post.oneliner ?? post.title} />
      <header className="row">
        <div
          className={`title-wrap lined-block col ${hasIcon ? 'span_5' : ''}`}
        >
          <h1>
            <a href={post.url}>{post.title}</a>
          </h1>
          <div className="post-meta">
            {post.date} {categoriesList.length && 'in'}
            {categoriesList}
            <div className="inline-tags">
              {' '}
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
          </div>
        </div>
        {hasIcon && (
          <div className="post-icon col span_1">
            <a href={post.url}>
              <img src={post.image[0]?.src} alt={post.image[0]?.alt} />
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

      {post.type !== 'project' && (
        <div className="row">
          <p className="signoff lined-block col">
            &mdash; <a href="https://twitter.com/kirbysayshi">@KirbySaysHi</a>{' '}
            {new Date(post.date + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
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
      <span className="exploded-url">
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
