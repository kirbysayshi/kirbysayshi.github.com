import { InlineTags } from "../components/InlineTags.tsx";
import type { PostData } from "../types.ts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function isoDate(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function displayDate(d: Date) {
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")}, ${d.getUTCFullYear()}`;
}

export default class PostLayout {
  data() {
    return { layout: "layouts/default.11ty.tsx" };
  }

  render(data: PostData) {
    const hasIcon = data.image?.[0]?.src != null;
    const firstCat = data.categories?.[0];
    const date = data.page.date;

    return (
      <article className="post">
        <header className="row">
          <div className={`title-wrap lined-block col${hasIcon ? " span_5" : ""}`}>
            <h1><a href={data.page.url}>{data.title}</a></h1>
            <div className="post-meta">
              {isoDate(date)}
              {firstCat && (
                <> in <a href={`/category/${firstCat.toLowerCase().replace(/ /g, "-")}.html`}>{firstCat}</a></>
              )}
              <InlineTags tags={data.tags} />
            </div>
          </div>
          {hasIcon && (
            <div className="post-icon col span_1">
              <a href={data.page.url}>
                <img src={data.image![0].src} alt={data.image![0].alt} />
              </a>
            </div>
          )}
        </header>

        <div className="post-content row">
          <div className="lined-block col">
            {data.oneliner && (
              <aside className="col span_3">
                {data.oneliner}
                {data.projecturl && (
                  <><br /><a className="project-url" href={data.projecturl}>{data.projecturl}</a></>
                )}
              </aside>
            )}
            <div dangerouslySetInnerHTML={{ __html: data.content }} />
          </div>
        </div>

        {data.type !== "project" && (
          <div className="row">
            <p className="signoff lined-block col">
              &mdash; <a href="https://twitter.com/kirbysayshi">@KirbySaysHi</a>{" "}
              {displayDate(date)}
            </p>
          </div>
        )}

        <div className="row hn-link" />

        <div dangerouslySetInnerHTML={{ __html: `
<div id="disqus_thread" class="lined-block"></div>
<button id="load-disqus" onclick="loadDisqus()">Add or View Comments (Disqus)</button>
<script type="text/javascript">
function loadDisqus() {
  var btn = document.querySelector('#load-disqus');
  btn.parentNode.removeChild(btn);
  var disqus_shortname = 'kirbysayshi'
    ,disqus_identifier = ${JSON.stringify("//kirbysayshi.com" + data.page.url)}
    ,disqus_developer = window.location.href.indexOf('localhost') > -1 ? 1 : 0;
  (function() {
    var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
    dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
  })();
}
<\/script>
`}} />
      </article>
    );
  }
}
