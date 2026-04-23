import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";

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
    const { data, content } = matter(raw);

    if (data.published === false) continue;

    const match = file.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.(md|markdown)$/);
    if (!match) continue;
    const [, year, month, day, slug] = match;

    const contentHtml = String(await processor.process(content));

    posts.push({
      slug,
      url: `/${year}/${month}/${day}/${slug}.html`,
      title: data.title ?? slug,
      date: `${year}-${month}-${day}`,
      year,
      month,
      day,
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

async function buildProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeShiki, {
      theme: "light-plus",
      fallbackLanguage: "text",
    })
    .use(rehypeStringify);
}
