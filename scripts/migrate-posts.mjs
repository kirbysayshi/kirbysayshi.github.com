// One-time script to replace Jekyll-specific Liquid tags in posts with
// plain markdown equivalents so posts work with markdownTemplateEngine: false.
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const postsDir = new URL("../_posts", import.meta.url).pathname;

function jekyllSlugToUrl(filenameOrSlug) {
  // Handles both "YYYY-MM-DD-slug" and "_posts/YYYY-MM-DD-slug.md"
  const base = filenameOrSlug
    .replace(/^.*_posts\//, "")
    .replace(/\.md$/, "");
  const match = base.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/);
  if (!match) return filenameOrSlug;
  const [, year, month, day, slug] = match;
  return `/${year}/${month}/${day}/${slug}.html`;
}

function migratePost(content) {
  // Remove {% raw %} / {% endraw %} wrappers (keep content inside)
  content = content.replace(/\{%[-\s]*raw\s*[-\s]*%\}/g, "");
  content = content.replace(/\{%[-\s]*endraw\s*[-\s]*%\}/g, "");

  // {% highlight lang %} ... {% endhighlight %} → fenced code block
  content = content.replace(
    /\{%[-\s]*highlight\s+(\S+)\s*[-\s]*%\}([\s\S]*?)\{%[-\s]*endhighlight[-\s]*%\}/g,
    (_, lang, code) => "```" + lang + "\n" + code.replace(/^\n/, "") + "```"
  );

  // {% link _posts/YYYY-MM-DD-slug.md %} → /YYYY/MM/DD/slug.html
  content = content.replace(
    /\{%[-\s]*link\s+(_posts\/[^\s%]+\.md)\s*[-\s]*%\}/g,
    (_, path) => jekyllSlugToUrl(path)
  );

  // {% post_url YYYY-MM-DD-slug %} → /YYYY/MM/DD/slug.html
  content = content.replace(
    /\{%[-\s]*post_url\s+([^\s%]+)\s*[-\s]*%\}/g,
    (_, slug) => jekyllSlugToUrl(slug)
  );

  return content;
}

const files = readdirSync(postsDir).filter((f) => f.endsWith(".md"));
let changed = 0;

for (const file of files) {
  const path = join(postsDir, file);
  const original = readFileSync(path, "utf-8");
  const migrated = migratePost(original);
  if (migrated !== original) {
    writeFileSync(path, migrated, "utf-8");
    console.log(`  migrated: ${file}`);
    changed++;
  }
}

console.log(`\nDone. ${changed} file(s) updated.`);
