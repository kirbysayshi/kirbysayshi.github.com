# Jekyll → React Router 7 Migration Plan

## Context

Personal blog at `kirbysayshi.github.com`. 46 published posts (Markdown, YAML frontmatter), deployed to GitHub Pages.

**Current stack:** Jekyll 3.10, Ruby, Liquid templates, manual Node.js tag/category generation scripts.

**Target stack:** React Router 7 (framework mode), Vite, pnpm, fully static pre-rendered HTML.

**Hard constraints:**
- All existing URLs must resolve identically. Permalink format: `/:year/:month/:day/:title.html`
- Tag pages at `/tag/{slug}.html` (111 tags)
- Category pages at `/category/{slug}.html` (19 categories)
- RSS feed at `/feed.xml`
- Static assets at same paths: `/css/main.css`, `/font/*`, `/images/*`, `/scripts/*`, `/stuff/*`, `/flash/*`
- Syntax highlighting using Shiki `light-plus` theme (closest built-in match to existing Pygments palette)
- Output is pure static HTML — no server, no JS runtime required

---

## Current Repo State

```
_posts/          # 46 published markdown files (YYYY-MM-DD-slug.md)
_drafts/         # 1 unpublished post
_layouts/        # default.html, post.html (Liquid templates)
_includes/       # post-list.html, inline-tags.html, ascii-kirby.html
_buildscripts/   # generate-categories.js, generate-tags.js, find-yaml-list.js
_config.yml      # permalink, title, description, url
css/main.css     # single CSS file (normalize + Font Awesome + Gridpak grid + custom)
font/            # Font Awesome webfonts (.eot, .woff, .ttf, .svg)
images/          # post images + me.jpg + icons/
scripts/         # main.js (jQuery plugin), html5shiv.js, modernizr.js, vash.js
flash/           # flash embeds
stuff/           # downloadable files
construction/    # design source files
favicon.ico
CNAME            # kirbysayshi.github.com (or kirbysayshi.com)
google96cb3b4e5f5a4989.html
feed.xml         # Jekyll RSS template
index.html       # Jekyll home template
404.html         # Jekyll 404 template
tag/             # GENERATED - delete after migration
category/        # GENERATED - delete after migration
Gemfile / Gemfile.lock
pnpm-workspace.yaml  # currently only has savePrefix: ''
```

### Post Frontmatter Schema

```yaml
---
layout: post          # always "post", ignored in RR7
title: String         # required
categories:           # list
  - Category Name
tags:                 # list
  - Tag Name
oneliner: String      # optional sidebar excerpt
type: post|project    # "project" suppresses signoff footer
projecturl: URL       # optional project link
image:                # optional featured image
  - src: /path/img
  - alt: Alt text
published: false      # optional, marks draft
---
```

Post filename encodes date + slug: `YYYY-MM-DD-slug-words.md`
URL: `/:year/:month/:day/:slug-words.html`

---

## Target File Structure

```
package.json
tsconfig.json
vite.config.ts
react-router.config.ts
app/
  root.tsx                  # HTML shell (<html>, <head>, <body>), Layout component
  routes.ts                 # Config-based route definitions (required for .html URL paths)
  lib/
    posts.ts                # Post parsing, data model, getAllPosts(), getPost()
  routes/
    home.tsx                # / — post listing
    post.tsx                # /:year/:month/:day/:slug.html
    tag.tsx                 # /tag/:slug.html
    category.tsx            # /category/:slug.html
    feed[.]xml.tsx          # /feed.xml resource route
    404.tsx                 # 404 page (also pre-rendered to /404.html)
public/
  css/main.css              # moved from css/
  font/                     # moved from font/
  images/                   # moved from images/
  scripts/                  # moved from scripts/
  flash/                    # moved from flash/
  stuff/                    # moved from stuff/
  favicon.ico
  CNAME
  google96cb3b4e5f5a4989.html
construction/               # unchanged
_posts/                     # unchanged
_drafts/                    # unchanged
```

---

## Implementation Steps

### Step 1 — Dependencies

package.json already exists with:

```json
    "dev": "react-router dev",
    "build": "react-router build",
    "preview": "vite preview --port 3000"
```

Need to add dependencies:

```sh
pnpm add react react-dom react-router
pnpm add -D @react-router/dev @types/react @types/react-dom gray-matter rehype-stringify remark-parse remark-rehype rehype-raw @shikijs/rehype unified vite typescript
```

---

### Step 2 — `tsconfig.json`

Standard RR7 tsconfig. Use `"moduleResolution": "bundler"`, `"jsx": "react-jsx"`, include `app/` and `*.ts`/`*.tsx` at root.

---

### Step 3 — `vite.config.ts`

```ts
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactRouter()],
});
```

No custom `publicDir` needed — `public/` is Vite's default.

---

### Step 4 — `react-router.config.ts`

```ts
import type { Config } from "@react-router/dev/config";
import { getAllPosts } from "./app/lib/posts";

export default {
  async prerender() {
    const posts = await getAllPosts();
    const tags = [...new Set(posts.flatMap(p => p.tags))];
    const categories = [...new Set(posts.flatMap(p => p.categories))];

    return [
      "/",
      "/feed.xml",
      "/404.html",
      ...posts.map(p => p.url),
      ...tags.map(t => `/tag/${slugify(t)}.html`),
      ...categories.map(c => `/category/${slugify(c)}.html`),
    ];
  },
} satisfies Config;
```

`slugify` should match the logic in `_buildscripts/generate-tags.js`: lowercase, replace spaces with hyphens.

---

### Step 5 — `app/routes.ts`

Use config-based routing (not file-based) because `.html` suffixes in URLs require literal dots in route paths, which file-based routing cannot express cleanly.

```ts
import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route(":year/:month/:day/:slug.html", "routes/post.tsx"),
  route("tag/:slug.html", "routes/tag.tsx"),
  route("category/:slug.html", "routes/category.tsx"),
  route("feed.xml", "routes/feed.xml.tsx"),
  route("404.html", "routes/404.tsx"),
] satisfies RouteConfig;
```

---

### Step 6 — `app/lib/posts.ts`

This is the core data layer. Runs in Node.js (at build time / during dev SSR). **Not imported in browser code directly** — only used inside loaders which run server-side during pre-render.

```ts
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { createHighlighter } from "shiki";

export interface Post {
  slug: string;         // from filename, e.g. "the-functions-you-need-for-arg-parsing"
  url: string;          // e.g. "/2020/03/25/the-functions-you-need-for-arg-parsing.html"
  title: string;
  date: string;         // ISO date string "YYYY-MM-DD"
  year: string;
  month: string;
  day: string;
  categories: string[];
  tags: string[];
  oneliner?: string;
  type?: "post" | "project";
  projecturl?: string;
  image?: Array<{ src: string; alt: string }>;
  contentHtml: string;
}

const POSTS_DIR = path.join(process.cwd(), "_posts");

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

let _cachedPosts: Post[] | null = null;

export async function getAllPosts(): Promise<Post[]> {
  if (_cachedPosts) return _cachedPosts;

  const highlighter = await createHighlighter({
    themes: ["light-plus"],
    langs: ["javascript", "typescript", "bash", "css", "html", "json",
            "markdown", "yaml", "python", "rust", "go", "jsx", "tsx",
            "shell", "text", "php"],
  });

  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify);

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith(".md") || f.endsWith(".markdown"));

  const posts: Post[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
    const { data, content } = matter(raw);

    if (data.published === false) continue;

    // Parse filename: YYYY-MM-DD-slug.md
    const match = file.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.(md|markdown)$/);
    if (!match) continue;
    const [, year, month, day, slug] = match;

    // Render markdown with shiki for code blocks
    const contentHtml = await renderMarkdown(content, processor, highlighter);

    posts.push({
      slug,
      url: `/${year}/${month}/${day}/${slug}.html`,
      title: data.title ?? slug,
      date: `${year}-${month}-${day}`,
      year, month, day,
      categories: data.categories ?? [],
      tags: data.tags ?? [],
      oneliner: data.oneliner,
      type: data.type,
      projecturl: data.projecturl,
      image: data.image,
      contentHtml,
    });
  }

  posts.sort((a, b) => b.date.localeCompare(a.date));
  _cachedPosts = posts;
  return posts;
}

async function renderMarkdown(content: string, processor: any, highlighter: any): Promise<string> {
  // Pre-process: replace fenced code blocks with shiki-highlighted HTML before unified
  const withHighlight = await applyShiki(content, highlighter);
  const result = await processor.process(withHighlight);
  return String(result);
}
```

**Shiki integration:** Use `@shikijs/rehype` (add to devDependencies). Shiki outputs inline `style` attributes, not CSS classes, so the existing Pygments CSS class rules (`.c`, `.k`, etc.) in `main.css` will be dead code — leave them, they're harmless.

```ts
import rehypeShiki from "@shikijs/rehype";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeShiki, { theme: "light-plus" })
  .use(rehypeStringify);
```

---

### Step 7 — `app/root.tsx`

Converts `_layouts/default.html` to a React component. Key elements to preserve exactly:

- `<html lang="en" class="no-js">`
- Google Fonts link
- `/css/main.css` stylesheet link
- `/feed.xml` alternate link
- Google Analytics script (UA-9588164-1) via gtag
- Header: ASCII Kirby SVG + "Hi." h1 + link to `/`
- Social contact bar: RSS, Twitter, GitHub, email links
- Footer: contact section, `me.jpg`, bio, attribution credits
- `<body class={classname}>` where classname comes from route (`page-home`, `page-post`, etc.)
- jQuery 1.7.1 from CDN + `/scripts/main.js`
- `<link rel="preload" as="image" href="/images/me.jpg">`

Use RR7's `<Meta />`, `<Links />`, `<Outlet />` in the appropriate places. **Do not include `<Scripts />`** — omitting it prevents the React hydration bundle from being shipped to the browser entirely, resulting in zero-JS framework overhead. Page-specific `<title>` and `<meta description>` are set via each route's `meta` export.

All internal links must use plain `<a href>` tags, not RR7's `<Link>` component. There is no client-side navigation — every link is a full page load.

The jQuery CDN script and `/scripts/main.js` are loaded via regular `<script>` tags (not `<Scripts />`), so they still work normally.

The ASCII Kirby SVG already exists at `/images/ascii_kirby.svg` (will be at `public/images/ascii_kirby.svg` after the asset move). Use `<img src="/images/ascii_kirby.svg" alt="ASCII Kirby" />` — no inlining needed.

---

### Step 8 — Route: `app/routes/home.tsx`

Maps to Jekyll's `index.html` + `_includes/post-list.html` (no filter, shows all posts).

```ts
export async function loader() {
  const posts = await getAllPosts();
  return { posts };
}

export function meta() {
  return [{ title: "Hi. — KSH" }];
}
```

Component: render list of posts. Each item shows title (linked), date, categories, tags (linked to `/category/slug.html` and `/tag/slug.html`). Replicate `_includes/post-list.html` layout.

Pass `classname="page-home"` to root layout.

---

### Step 9 — Route: `app/routes/post.tsx`

```ts
export async function loader({ params }) {
  const { year, month, day, slug } = params;
  // slug param will NOT include .html — RR7 strips the literal suffix
  const posts = await getAllPosts();
  const post = posts.find(p => p.year === year && p.month === month && p.day === day && p.slug === slug);
  if (!post) throw new Response("Not Found", { status: 404 });
  return { post };
}

export function meta({ data }) {
  return [{ title: `${data.post.title} — KSH` }];
}
```

Component mirrors `_layouts/post.html`:
- Post header: title, date, category links, inline tags
- Optional: post icon image (if `image[0].src`)
- Optional sidebar: `oneliner` + `projecturl` (if `oneliner` is set)
- Content: `dangerouslySetInnerHTML={{ __html: post.contentHtml }}`
- Signoff: "— @KirbySaysHi [date]" (hidden if `type === "project"`)
- Disqus section (lazy-loaded via button click, same inline script as original)
  - `disqus_identifier = '//kirbysayshi.com' + url` (note: uses kirbysayshi.com not .github.com)

Pass `classname="page-post"` to root layout.

---

### Step 10 — Route: `app/routes/tag.tsx`

```ts
export async function loader({ params }) {
  const { slug } = params; // slug without .html
  const posts = await getAllPosts();
  const tagPosts = posts.filter(p => p.tags.some(t => slugify(t) === slug));
  const tagName = tagPosts[0]?.tags.find(t => slugify(t) === slug) ?? slug;
  return { tagPosts, tagName };
}
```

Component: heading "Showing Posts tagged [tag]", then post list (same as home).

---

### Step 11 — Route: `app/routes/category.tsx`

Same pattern as tag route but filtering on `categories`.

---

### Step 12 — Route: `app/routes/feed[.]xml.tsx`

Resource route returning RSS XML. The `[.]` escaping is needed in file-based routing to avoid the dot being parsed as a layout separator. Since we're using config-based routing (`routes.ts`), the filename can be anything — just make the loader return a `Response`.

```ts
export async function loader() {
  const posts = await getAllPosts();
  const recent = posts.slice(0, 10);
  const xml = buildRssXml(recent);
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
```

RSS structure (match existing `feed.xml`):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>KSH</title>
    <description>Thoughts, posts, and projects by KirbySaysHi (Andrew Petersen)</description>
    <link>//kirbysayshi.github.com</link>
    <item>
      <title>...</title>
      <description><!-- HTML-escaped rendered content --></description>
      <link>https://kirbysayshi.github.com/YYYY/MM/DD/slug.html</link>
    </item>
    ...
  </channel>
</rss>
```

---

### Step 13 — Route: `app/routes/404.tsx`

Simple component. Also pre-rendered to `/404.html` (GitHub Pages picks this up automatically for missing pages).

---

### Step 14 — Move Static Assets

Move these directories/files into `public/`:

| From | To |
|------|----|
| `css/` | `public/css/` |
| `font/` | `public/font/` |
| `images/` | `public/images/` |
| `scripts/` | `public/scripts/` |
| `flash/` | `public/flash/` |
| `stuff/` | `public/stuff/` |
| `favicon.ico` | `public/favicon.ico` |
| `CNAME` | `public/CNAME` |
| `google96cb3b4e5f5a4989.html` | `public/google96cb3b4e5f5a4989.html` |

Do NOT move `_posts/`, `_drafts/`.

---

### Step 15 — GitHub Actions Deploy

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [master]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: build/client
      - uses: actions/deploy-pages@v4
        id: deploy
```

Configure GitHub Pages in repo settings: **Source → GitHub Actions**.

---

### Step 16 — Cleanup (after build verified)

Delete files made obsolete by migration:
- `_layouts/`
- `_includes/`
- `_buildscripts/`
- `tag/` (generated HTML files)
- `category/` (generated HTML files)
- `index.html` (Jekyll template)
- `feed.xml` (Jekyll template)
- `404.html` (Jekyll template)
- `_config.yml`
- `Gemfile`, `Gemfile.lock`

Keep `savePrefix: ''` in `pnpm-workspace.yaml`

Update `.gitignore`: replace `_site` entry with `build/` and `node_modules/`.

Update footer attribution in `app/root.tsx` to replace "Jekyll" with "React Router 7".

---

## Key Technical Notes

### Route param for `.html` URLs

When route is defined as `:year/:month/:day/:slug.html`, RR7 sets `params.slug` to the part before `.html`. So `params.slug` is `"the-functions-you-need-for-arg-parsing"` (no extension). Match this against the slug extracted from the post filename.

### Tag/Category slugify

The existing `_buildscripts/generate-tags.js` slugifies by: `.toLowerCase()`. Check the actual logic in that file. The generated `tag/` and `category/` filenames are the ground truth for what slugs currently exist. Ensure `slugify()` in `app/lib/posts.ts` produces identical slugs to avoid broken URLs.

**Look at the existing files in `tag/` and `category/` directories for the expected slug format** — compare against category/tag names in frontmatter to derive the exact transformation.

### Shiki language support

Posts use code blocks with these languages (from existing output): `ts`, `js`, `bash`, `shell`, `css`, `html`, `json`. Also `text`/plain for unlabeled blocks. Ensure all are in the `langs` array passed to `createHighlighter`. Unknown languages should fall back to plain text, not throw errors — set `fallbackLanguage: "text"` or handle the error.

### No React JS in the browser

Omitting `<Scripts />` from `app/root.tsx` means no React runtime, no hydration bundle, and no client-side routing JS is ever sent to the browser. The pre-rendered HTML is served as-is. Loaders run only in Node during the build — file system access (`fs.readFileSync`) is safe. All links are plain `<a>` tags causing full page loads.

### `prerender` output location

RR7 outputs pre-rendered files to `build/client/`. The path `/2020/03/25/slug.html` becomes `build/client/2020/03/25/slug.html`. GitHub Pages serves this correctly when deployed from the `build/client/` directory.

### 404 page

GitHub Pages serves `404.html` from the repo root for missing pages. When deploying from `build/client/`, the pre-rendered `/404.html` will be at `build/client/404.html` and GitHub Pages will find it.

---

## Verification Checklist

After `pnpm build`:

- [ ] `build/client/index.html` exists and contains post list
- [ ] `build/client/2020/03/25/the-functions-you-need-for-arg-parsing.html` exists (spot-check)
- [ ] `build/client/tag/cli.html` exists (spot-check — check actual slug from existing `tag/` dir)
- [ ] `build/client/category/javascript.html` exists
- [ ] `build/client/feed.xml` is valid RSS XML with 10 items
- [ ] `build/client/css/main.css` exists
- [ ] `build/client/images/me.jpg` exists
- [ ] `build/client/CNAME` exists
- [ ] `build/client/404.html` exists
- [ ] Code blocks in posts have `class="shiki light-plus"` markup with colored token spans
- [ ] All 46 posts pre-rendered (count files under `build/client/20*/`)
- [ ] All 111 tag pages pre-rendered (count files under `build/client/tag/`)
- [ ] All 19 category pages pre-rendered (count files under `build/client/category/`)
