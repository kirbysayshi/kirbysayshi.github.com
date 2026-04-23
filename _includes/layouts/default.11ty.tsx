import { AsciiKirby } from "../components/AsciiKirby.tsx";
import type { DefaultData } from "../types.ts";

export default class DefaultLayout {
  render(data: DefaultData) {
    return (
      <html lang="en" className="no-js">
        <head>
          <meta charSet="utf-8" />
          <meta name="description" content="Hi. Writing is HARD!" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
          <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no" />
          <link href="//fonts.googleapis.com/css?family=Open+Sans+Condensed:700" rel="stylesheet" type="text/css" />
          <link rel="stylesheet" type="text/css" href="/css/main.css" />
          <link rel="alternate" type="application/rss+xml" title="Hi! - KSH" href="/feed.xml" />
          <title>{`${data.title ?? ""} — KSH`}</title>
          <script async src="https://www.googletagmanager.com/gtag/js?id=UA-9588164-1" />
          <script dangerouslySetInnerHTML={{ __html: "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','UA-9588164-1');" }} />
        </head>
        <body className={data.classname}>
          <div id="header-container">
            <header>
              <a href="/">
                <AsciiKirby />
                <h1>Hi.</h1>
              </a>
            </header>
          </div>
          <div id="content-container">
            <article className="cf">
              <div id="social-contacts-header" className="row lined-block cf">
                <h2 className="col span_3">
                  <a className="header-contact" href="#contact">Contact</a>
                </h2>
                <h2 className="social-icons col span_3">
                  <a target="_blank" rel="noreferrer" className="icon-large icon-rss" href="/feed.xml"></a>
                  <a target="_blank" rel="noreferrer" className="icon-large icon-twitter-sign" href="https://twitter.com/kirbysayshi"></a>
                  <a target="_blank" rel="noreferrer" className="icon-large icon-github-sign" href="https://github.com/kirbysayshi"></a>
                  <a className="icon-large icon-envelope" href="mailto:senofpeter@gmail.com"></a>
                </h2>
              </div>
              <div dangerouslySetInnerHTML={{ __html: data.content }} />
            </article>
          </div>
          <div id="footer-container">
            <footer className="row">
              <h3 id="contact" className="lined-block col span_6">What? Who?</h3>
              <div className="row">
                <img
                  className="lined-block col span_3"
                  src="/images/me.jpg"
                  alt="Me, drawn in the cockpit of an aircraft that definitely doesn't exist."
                />
                <div className="bio-short col span_3">
                  <p>Hi. This is the personal blog of Andrew Petersen.</p>
                  <ul className="contact-list">
                    <li className="icon-large icon-twitter-sign">
                      <a href="https://twitter.com/kirbysayshi">@KirbySaysHi</a>
                    </li>
                    <li className="icon-large icon-github-sign">
                      <a href="https://github.com/kirbysayshi">Github</a>
                    </li>
                    <li className="icon-large icon-envelope">
                      <a href="mailto:senofpeter@gmail.com">senofpeter@gmail.com</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="row">
                This blog is hosted on{" "}
                <a href="https://pages.github.com/">Github Pages</a>, and uses{" "}
                <a href="https://www.11ty.dev/">Eleventy</a>,{" "}
                <a href="https://github.com/necolas/normalize.css">normalize.css</a>,{" "}
                <a href="https://fortawesome.github.com/Font-Awesome/">Font Awesome</a>,{" "}
                <a href="https://gridpak.com/">Gridpak</a>, and{" "}
                <a href="https://www.google.com/webfonts">Google Web Fonts</a>.
              </div>
            </footer>
          </div>
          <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js" />
          <script type="text/javascript" src="/scripts/main.js" />
          <script type="text/javascript" dangerouslySetInnerHTML={{ __html: "jQuery(function(){ ksh.defaultInit(); })" }} />
        </body>
      </html>
    );
  }
}
