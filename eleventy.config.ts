import "tsx";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { type EleventyScope, type EleventyConfig } from "11ty.ts";
import { fromHighlighter } from "@shikijs/markdown-it/core";
import { createHighlighter } from "shiki";
import MarkdownIt from "markdown-it";

// TODO: refactor this a bit so it's less of a giant closure

const highlighter = await createHighlighter({
  // TODO: change the theme
  themes: ["solarized-light"],
  langs: [
    "javascript", "typescript", "tsx", "jsx",
    "html", "css", "json", "yaml", "markdown",
    "bash", "sh", "python", "ruby", "coffeescript",
    "php", "perl", "text",
  ],
});


function slugify(name: string) {
  return name.toLowerCase().replace(/ /g, "-");
}

const POST_GLOB = ["_posts/*.md", "_posts/*.markdown"];

export default function (eleventyConfig: EleventyConfig) {
  // TSX/JSX: render() returns a ReactElement, wrap with renderToStaticMarkup
  eleventyConfig.addExtension(["11ty.jsx", "11ty.tsx"], {
    key: "11ty.js",
    compile() {
      return async function (this: any, data: any) {
        const content = await this.defaultRenderer(data);
        const html = renderToStaticMarkup(content);
        // Prepend doctype for root HTML documents
        return html.startsWith("<html") ? `<!DOCTYPE html>${html}` : html;
      };
    },
  });
  eleventyConfig.addTemplateFormats(["11ty.jsx", "11ty.tsx"]);

  // Plain TS: render() returns a string directly (used for feed.xml etc.)
  eleventyConfig.addExtension("11ty.ts", { key: "11ty.js" });
  eleventyConfig.addTemplateFormats("11ty.ts");

  eleventyConfig.amendLibrary("md", (md: MarkdownIt) =>
    md.use(fromHighlighter(highlighter, { theme: "solarized-light" }))
  );

  // Treat .markdown the same as .md
  eleventyConfig.addExtension("markdown", { key: "md" });
  eleventyConfig.addTemplateFormats("markdown");

  // Layout aliases so post frontmatter `layout: post` keeps working
  eleventyConfig.addLayoutAlias("post", "layouts/post.11ty.tsx");
  eleventyConfig.addLayoutAlias("default", "layouts/default.11ty.tsx");

  // Allow .ts directory data files (tsx is already registered so import() handles them)
  eleventyConfig.addDataExtension("ts", {
    read: false,
    parser: async (filePath: string) => {
      const mod = await import(filePath);
      return mod.default ?? mod;
    },
  });

  // Static assets — .eleventyignore handles template exclusion, config just copies
  for (const dir of ["css", "images", "scripts", "font", "stuff", "flash", "construction"]) {
    eleventyConfig.addPassthroughCopy(dir);
    eleventyConfig.addWatchTarget(dir);
  }
  for (const file of ["favicon.ico", "CNAME", "google96cb3b4e5f5a4989.html"]) {
    eleventyConfig.addPassthroughCopy(file);
  }

  // All posts, newest first
  eleventyConfig.addCollection("posts", (collection) =>
    collection.getFilteredByGlob(POST_GLOB).reverse()
  );

  // One entry per category slug: { name, slug, posts[] }
  eleventyConfig.addCollection("categoriesList", (collection) => {
    const posts = collection.getFilteredByGlob(POST_GLOB).reverse();
    const map = new Map<string, { name: string; slug: string; posts: any[] }>();
    for (const post of posts) {
      for (const cat of (post.data.categories as string[]) ?? []) {
        const slug = slugify(cat);
        if (!map.has(slug)) map.set(slug, { name: cat, slug, posts: [] });
        map.get(slug)!.posts.push(post);
      }
    }
    return Array.from(map.values());
  });

  // One entry per tag slug: { name, slug, posts[] }
  eleventyConfig.addCollection("tagsList", (collection) => {
    const posts = collection.getFilteredByGlob(POST_GLOB).reverse();
    const map = new Map<string, { name: string; slug: string; posts: any[] }>();
    for (const post of posts) {
      for (const tag of (post.data.tags as string[]) ?? []) {
        const slug = slugify(tag);
        if (!map.has(slug)) map.set(slug, { name: tag, slug, posts: [] });
        map.get(slug)!.posts.push(post);
      }
    }
    return Array.from(map.values());
  });

  // Populated during collection building (which runs before transforms)
  const mdUrlMap = new Map<string, string>();

  // Build inputPath → url map for the .md link resolver below
  eleventyConfig.addCollection("_mdUrlIndex", (collectionApi) => {
    mdUrlMap.clear();
    for (const item of collectionApi.getAll()) {
      if (typeof item.url === "string") {
        mdUrlMap.set(item.inputPath.replace(/^\.\//, ""), item.url);
      }
    }
    return [];
  });

  // Rewrite href="relative/path.md" links to their output URLs
  eleventyConfig.addTransform(
    "resolve-md-links",
    function (this: EleventyScope, content: string, outputPath: string) {
      if (!outputPath?.endsWith(".html")) return content;
      const dir = path.dirname(this.page.inputPath.replace(/^\.\//, ""));
      return content.replace(
        /href="([^"]+\.(?:md|markdown)(?:#[^"]*)?)"/g,
        (_match, href: string) => {
          if (/^https?:\/\//.test(href)) return `href="${href}"`;
          const hashIdx = href.indexOf("#");
          const filePart = hashIdx === -1 ? href : href.slice(0, hashIdx);
          const anchor = hashIdx === -1 ? "" : href.slice(hashIdx);
          const resolved = filePart.startsWith("/")
            ? filePart.slice(1)
            : path.normalize(path.join(dir, filePart));
          const url = mdUrlMap.get(resolved);
          return url ? `href="${url}${anchor}"` : `href="${href}"`;
        }
      );
    }
  );

  return {
    markdownTemplateEngine: false,
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
  };
}
