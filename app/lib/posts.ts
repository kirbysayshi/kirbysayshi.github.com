import fs from "node:fs";
import path from "node:path";
import fm from "front-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";

export interface Post {
  slug: string;
  url: string;
  title: string;
  date: string;
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

// Match existing Jekyll behavior: lowercase + spaces to hyphens, no other transforms
export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, "-");
}

let _cachedPosts: Post[] | null = null;

export async function getAllPosts(): Promise<Post[]> {
  if (_cachedPosts) return _cachedPosts;

  const processor = await buildProcessor();

  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md") || f.endsWith(".markdown"));

  const posts: Post[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
    const { attributes: attr, body } = fm<Record<string, unknown>>(raw);

    if (attr.published === false) continue;

    const match = file.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.(md|markdown)$/);
    if (!match) continue;
    const [, year, month, day, slug] = match;

    const contentHtml = String(await processor.process(body));

    posts.push({
      slug,
      url: `/${year}/${month}/${day}/${slug}.html`,
      title: typeof attr.title === "string" ? attr.title : slug,
      date: `${year}-${month}-${day}`,
      year,
      month,
      day,
      categories: Array.isArray(attr.categories) ? attr.categories : [],
      tags: Array.isArray(attr.tags) ? attr.tags : [],
      oneliner: typeof attr.oneliner === "string" ? attr.oneliner : undefined,
      type: attr.type === "post" || attr.type === "project" ? attr.type : undefined,
      projecturl: typeof attr.projecturl === "string" ? attr.projecturl : undefined,
      image: Array.isArray(attr.image) ? attr.image : undefined,
      contentHtml,
    });
  }

  posts.sort((a, b) => b.date.localeCompare(a.date));
  _cachedPosts = posts;
  return posts;
}

// Rewrite relative markdown file links to matching YYYY-MM-DD-slug.md  ->
// /YYYY/MM/DD/slug.html
const rehypePostLinks = () => (tree: Root) => {
  visit(tree, "element", (node: Element) => {
    if (node.tagName !== "a") return;
    const href = node.properties?.href;
    if (typeof href !== "string") return;
    // Absolute or has a protocol
    if (href.startsWith("/") || /^[a-z][a-z+\-.]*:/i.test(href)) return;
    const filename = href.split("/").at(-1) ?? "";
    const m = filename.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.(?:md|markdown)$/);
    if (m) node.properties.href = `/${m[1]}/${m[2]}/${m[3]}/${m[4]}.html`;
  });
};

async function buildProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypePostLinks)
    .use(rehypeShiki, {
      theme: "light-plus",
      fallbackLanguage: "text",
    })
    .use(rehypeStringify);
}
