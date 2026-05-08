import rehypeShiki from '@shikijs/rehype';
import type { Element, Root as HastRoot } from 'hast';
import type { Root as MdastRoot } from 'mdast';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { type Plugin, unified } from 'unified';
import { visit } from 'unist-util-visit';
import { parse } from 'yaml';

import { CDNVideoPlayer } from '../components/CDNVideoPlayer.js';
import {
  type PostFrontmatter,
  postFrontmatterSchema,
} from './post-meta.schema.js';
import { rehypeReactComponents } from './rehype-react-components.js';

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
  const rawPosts = import.meta.glob<string>('../../_posts/*.{md,markdown}', {
    query: '?raw',
    import: 'default',
    eager: true,
  });

  const processor = buildProcessor();
  const posts: RenderedPost[] = [];

  for (const [filepath, contents] of Object.entries(rawPosts)) {
    posts.unshift(await postFrom(filepath, contents, processor));
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
const rehypePostLinks = () => (tree: HastRoot) => {
  visit(tree, 'element', (node: Element) => {
    if (node.tagName !== 'a') return;
    const href = node.properties.href;
    if (
      typeof href !== 'string' ||
      href[0] === '/' ||
      /^[a-z][a-z+\-.]*:/i.test(href) ||
      href[0] === '#'
    )
      return;

    const parsed = parsePostFilename(href);
    if (parsed.error) throw parsed.error;
    node.properties.href = `/${parsed.year}/${parsed.month}/${parsed.day}/${parsed.slug}.html`;
  });
};

const remarkExtractFrontmatter: Plugin<[], MdastRoot> = () => {
  return (tree, file) => {
    visit(tree, 'yaml', (node, index, parent) => {
      if (index === undefined || !parent) return;
      file.data.frontmatter = parse(node.value);
      parent.children.splice(index, 1);
      return index;
    });
  };
};

function buildProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkExtractFrontmatter)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeReactComponents, {
      components: {
        'cdn-video-player': CDNVideoPlayer,
      },
    })
    .use(rehypePostLinks)
    .use(rehypeExternalLinks)
    .use(rehypeShiki, {
      theme: 'light-plus',
      fallbackLanguage: 'text',
    })
    .use(rehypeStringify);
}

async function postFrom(
  filename: string,
  contents: string,
  proc: ReturnType<typeof buildProcessor>,
) {
  const file = await proc.process(contents);
  if (!file.data.frontmatter)
    throw new Error(`Processed frontmatter missing for ${filename}`);
  const fm = postFrontmatterSchema.parse(file.data.frontmatter);
  const parsed = parsePostFilename(filename);
  if (parsed.error) throw parsed.error;

  return {
    slug: parsed.slug,
    url: `/${parsed.year}/${parsed.month}/${parsed.day}/${parsed.slug}.html`,
    title: fm.title,
    date: `${parsed.year}-${parsed.month}-${parsed.day}`,
    categories: fm.categories ?? [],
    tags: fm.tags ?? [],
    oneliner: fm.oneliner ?? '',
    projecturl: fm.projecturl ?? '',
    image: fm.image ?? [],
    contentHtml: String(file.value),
  };
}
