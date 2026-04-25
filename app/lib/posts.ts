import rehypeShiki from '@shikijs/rehype';
import fm from 'front-matter';
import type { Element, Root } from 'hast';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

import {
  type PostFrontmatter,
  postFrontmatterSchema,
} from './post-meta.schema.js';

type RenderedPost = {
  slug: string;
  url: string;

  date: string;

  title: PostFrontmatter['title'];
  categories: NonNullable<PostFrontmatter['categories']>;
  tags: NonNullable<PostFrontmatter['tags']>;
  oneliner: NonNullable<PostFrontmatter['oneliner']> | null;
  type: NonNullable<PostFrontmatter['type']>;
  projecturl: NonNullable<PostFrontmatter['projecturl']>;
  image: NonNullable<PostFrontmatter['image']>;

  contentHtml: string;
};

const posts: RenderedPost[] = [];

export async function getAllPosts(): Promise<RenderedPost[]> {
  if (posts.length) return posts;

  const rawPosts = await import.meta.glob<string>(
    ['../../_posts/*.{md,markdown}'],
    {
      query: '?raw',
      import: 'default',
      eager: true,
    },
  );

  const processor = await buildProcessor();

  for (const [filepath, contents] of Object.entries(rawPosts)) {
    const { attributes: raw_attr, body } =
      fm<Record<string, unknown>>(contents);
    const attr = postFrontmatterSchema.parse(raw_attr);

    if (attr.published === false) continue;

    const match = matchPostFilename(filepath);
    if (!match) continue;
    const [, year, month, day, rawSlug] = match;
    const slug = slugify(rawSlug);

    const contentHtml = String(await processor.process(body));

    posts.push({
      slug: slug,
      url: `/${year}/${month}/${day}/${slug}.html`,
      title: attr.title,
      date: `${year}-${month}-${day}`,
      categories: attr.categories ?? [],
      tags: attr.tags ?? [],
      oneliner: attr.oneliner ?? '',
      type: attr.type ?? 'post',
      projecturl: attr.projecturl ?? '',
      image: attr.image ?? [],
      contentHtml,
    });
  }

  posts.sort((a, b) => b.date.localeCompare(a.date));
  return posts;
}

/**
 * Jekyll behavior: lowercase + spaces to hyphens
 */
export function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-');
}

function matchPostFilename(name?: string) {
  return name?.match(/\/(\d{4})-(\d{2})-(\d{2})-(.+)\.(md|markdown)$/) ?? [];
}

// Rewrite relative markdown file links: YYYY-MM-DD-slug.md  ->
// /YYYY/MM/DD/slug.html
const rehypePostLinks = () => (tree: Root) => {
  visit(tree, 'element', (node: Element) => {
    if (node.tagName !== 'a') return;
    const href = node.properties?.href;
    if (typeof href !== 'string') return;
    // Absolute or has a protocol
    if (href.startsWith('/') || /^[a-z][a-z+\-.]*:/i.test(href)) return;
    const filename = href.split('/').at(-1) ?? '';
    const m = matchPostFilename(filename);
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
      theme: 'light-plus',
      fallbackLanguage: 'text',
    })
    .use(rehypeStringify);
}
