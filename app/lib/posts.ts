import rehypeShiki from '@shikijs/rehype';
import fm from 'front-matter';
import type { Element, Root } from 'hast';
import rehypeExternalLinks from 'rehype-external-links';
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
  projecturl: NonNullable<PostFrontmatter['projecturl']>;
  image: NonNullable<PostFrontmatter['image']>;

  contentHtml: string;
};

export async function getAllPosts(): Promise<RenderedPost[]> {
  const posts: RenderedPost[] = [];

  const rawPosts = import.meta.glob<string>(['../../_posts/*.{md,markdown}'], {
    query: '?raw',
    import: 'default',
    eager: true,
  });

  const processor = buildProcessor();

  for (const [filepath, contents] of Object.entries(rawPosts)) {
    const { attributes: raw_attr, body } =
      fm<Record<string, unknown>>(contents);
    const attr = postFrontmatterSchema.parse(raw_attr);

    if (attr.published === false) continue;

    const parsed = parsePostFilename(filepath);
    if (parsed.error) throw parsed.error;

    const contentHtml = String(await processor.process(body));

    posts.unshift({
      slug: parsed.slug,
      url: `/${parsed.year}/${parsed.month}/${parsed.day}/${parsed.slug}.html`,
      title: attr.title,
      date: `${parsed.year}-${parsed.month}-${parsed.day}`,
      categories: attr.categories ?? [],
      tags: attr.tags ?? [],
      oneliner: attr.oneliner ?? '',
      projecturl: attr.projecturl ?? '',
      image: attr.image ?? [],
      contentHtml,
    });
  }

  // Probably not necessary, should already be in filesystem order.
  posts.sort((a, b) => b.date.localeCompare(a.date));
  return posts;
}

/**
 * Jekyll behavior: lowercase + spaces to hyphens
 */
export function slugify(str?: string) {
  return str?.toLowerCase().replace(/\s+/g, '-') ?? '';
}

type ParsedFilename =
  | { error: null; year: string; month: string; day: string; slug: string }
  | { error: Error };

function parsePostFilename(name: string) {
  const match =
    name.match(/\/?(\d{4})-(\d{2})-(\d{2})-(.+)\.(md|markdown)$/) ?? [];
  const [, year, month, day, rawSlug] = match;
  const slug = slugify(rawSlug);

  const out: ParsedFilename = {
    year: year ?? '',
    month: month ?? '',
    day: day ?? '',
    slug: slug,
    error: null as null | Error,
  };

  if (!year || !month || !day || !rawSlug) {
    out.error = new Error(
      `InvalidPostFileName: unable to parse [YYYY, MM, DD, slug] got: ${[year, month, day, rawSlug].join(', ')} from ${name}`,
    );
  }

  return out;
}

// Rewrite relative markdown file links: YYYY-MM-DD-slug.md  ->
// /YYYY/MM/DD/slug.html
const rehypePostLinks = () => (tree: Root) => {
  visit(tree, 'element', (node: Element) => {
    if (node.tagName !== 'a') return;
    const href = node.properties.href;
    if (
      typeof href !== 'string' ||
      // Absolute or has a protocol
      href.startsWith('/') ||
      /^[a-z][a-z+\-.]*:/i.test(href)
    )
      return;

    const parsed = parsePostFilename(href);
    if (parsed.error) throw parsed.error;
    node.properties.href = `/${parsed.year}/${parsed.month}/${parsed.day}/${parsed.slug}.html`;
  });
};

function buildProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypePostLinks)
    .use(rehypeExternalLinks)
    .use(rehypeShiki, {
      theme: 'light-plus',
      fallbackLanguage: 'text',
    })
    .use(rehypeStringify);
}
