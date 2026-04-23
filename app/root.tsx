import { Links, Meta, Outlet, useMatches } from "react-router";
import type { Route } from "./+types/root";

export function links() {
  return [
    { rel: "preload", as: "image", href: "/images/me.jpg" },
    { rel: "stylesheet", href: "/css/main.css" },
    {
      rel: "alternate",
      type: "application/rss+xml",
      title: "Hi! - KSH",
      href: "/feed.xml",
    },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="no-js">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,shrink-to-fit=no"
        />
        <link
          href="//fonts.googleapis.com/css?family=Open+Sans+Condensed:700"
          rel="stylesheet"
          type="text/css"
        />
        <Meta />
        <Links />
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=UA-9588164-1"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','UA-9588164-1');`,
          }}
        />
      </head>
      {children}
    </html>
  );
}

export default function App() {
  const matches = useMatches();
  const classname =
    (matches.at(-1)?.handle as { classname?: string } | undefined)
      ?.classname ?? "page-home";
  return <PageBody classname={classname} />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <body className="page-404">
      <SiteShell>
        <h1>Something went wrong</h1>
        <p>{error instanceof Error ? error.message : String(error)}</p>
      </SiteShell>
    </body>
  );
}

function PageBody({ classname }: { classname: string }) {
  return (
    <body className={classname}>
      <SiteShell>
        <Outlet />
      </SiteShell>
    </body>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div id="header-container">
        <header>
          <a href="/">
            <img src="/images/ascii_kirby.svg" alt="ASCII Kirby" />
            <h1>Hi.</h1>
          </a>
        </header>
      </div>
      <div id="content-container">
        <article className="cf">
          <div id="social-contacts-header" className="row lined-block cf">
            <h2 className="col span_3">
              <a className="header-contact" href="#contact">
                Contact
              </a>
            </h2>
            <h2 className="social-icons col span_3">
              <a
                target="_blank"
                className="icon-large icon-rss"
                href="/feed.xml"
              />
              <a
                target="_blank"
                className="icon-large icon-twitter-sign"
                href="https://twitter.com/kirbysayshi"
              />
              <a
                target="_blank"
                className="icon-large icon-github-sign"
                href="https://github.com/kirbysayshi"
              />
              <a
                className="icon-large icon-envelope"
                href="mailto:senofpeter@gmail.com"
              />
            </h2>
          </div>
          {children}
        </article>
      </div>
      <div id="footer-container">
        <footer className="row">
          <h3 id="contact" className="lined-block col span_6">
            What? Who?
          </h3>
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
                  <a href="mailto:senofpeter@gmail.com">
                    senofpeter@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="row">
            This blog is hosted on{" "}
            <a href="https://pages.github.com/">Github Pages</a>, and uses{" "}
            <a href="https://reactrouter.com/">React Router 7</a>,{" "}
            <a href="https://github.com/necolas/normalize.css">
              normalize.css
            </a>
            ,{" "}
            <a href="https://stevenlevithan.com/regex/colorizer/">
              Regex Colorizer
            </a>
            ,{" "}
            <a href="https://nicolasgallagher.com/micro-clearfix-hack/">
              micro clearfix
            </a>
            ,{" "}
            <a href="https://fortawesome.github.com/Font-Awesome/">
              Font Awesome
            </a>
            , <a href="https://gridpak.com/">Gridpak</a>,{" "}
            <a href="https://github.com/kirbysayshi">Vash</a>,{" "}
            <a href="https://www.google.com/webfonts">Google Web Fonts</a>,
            and <a href="https://jquery.com">jQuery</a>.
          </div>
        </footer>
      </div>
      <script
        type="text/javascript"
        src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"
      />
      <script type="text/javascript" src="/scripts/main.js" />
      <script
        type="text/javascript"
        dangerouslySetInnerHTML={{
          __html: `jQuery(function(){ ksh.defaultInit(); })`,
        }}
      />
    </>
  );
}
