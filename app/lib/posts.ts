import path from 'node:path';

import rehypeShiki from '@shikijs/rehype';
import type { Element, Root as HastRoot } from 'hast';
import { h } from 'hastscript';
import type { Root as MdastRoot } from 'mdast';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeParse from 'rehype-parse';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { type Plugin, unified } from 'unified';
import { SKIP, visit } from 'unist-util-visit';
import { parse } from 'yaml';

import { cdnUrl, MediaManifest } from './media.js';
import {
  type PostFrontmatter,
  postFrontmatterSchema,
} from './post-meta.schema.js';
import { rehypeReactComponents } from './rehype-react-components.js';

type PostMeta = {
  filename: string;
  slug: string;
  url: string;
  permalinks: string[];

  date: NonNullable<PostFrontmatter['date']>;

  title: PostFrontmatter['title'];
  categories: NonNullable<PostFrontmatter['categories']>;
  tags: NonNullable<PostFrontmatter['tags']>;
  oneliner: NonNullable<PostFrontmatter['oneliner']> | null;
  projecturl: NonNullable<PostFrontmatter['projecturl']>;
  image: NonNullable<PostFrontmatter['image']>;
};

type RenderedPost = PostMeta & {
  contentHtml: string;
};

export async function getAllPosts(): Promise<RenderedPost[]> {
  const rawPosts = import.meta.glob<string>('../../_posts/*.{md,markdown}', {
    query: '?raw',
    import: 'default',
    eager: true,
  });

  const processor = buildMarkdownProcessor();
  const posts: RenderedPost[] = [];

  for (const [filepath, contents] of Object.entries(rawPosts)) {
    posts.unshift(await postFrom(filepath, contents, processor));
  }

  const proc2 = buildHTMLProcessor(posts);
  for (const post of posts) {
    const fixed = await proc2.process(post.contentHtml);
    post.contentHtml = fixed.toString();
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
const rehypePostLinks = (posts: PostMeta[]) => () => (tree: HastRoot) => {
  visit(tree, 'element', (node: Element) => {
    if (node.tagName !== 'a') return;
    const href = node.properties.href;

    if (
      typeof href !== 'string' ||
      href[0] === '/' ||
      /^[a-z][a-z+\-.]*:/i.test(href) ||
      !/\.(markdown|md)$/i.test(href) ||
      href[0] === '#'
    )
      return;

    const filename = path.basename(href);
    const target = posts.find((p) => p.filename === filename);
    if (!target) throw new Error(`Could not find post named ${filename}`);
    node.properties.href = target.url;
  });
};

/**
 * Coerce to React/hast-compatible values (e.g. `attr="false"` -> `attr: false`
 * to _remove_ that attribute from the HTML). Authoring JSX or hyperscript
 * wouldn't need this normally: we're accepting markdown-authored HTML, where
 * everything is a string.
 */
function coerceHTMLLikeProperties(props: Record<string, unknown>) {
  for (const [key, val] of Object.entries(props)) {
    if (typeof val !== 'string') continue;
    if (val === 'true') props[key] = true;
    else if (val === 'false') props[key] = false;
    else if (val.match(/0-9+\.0-9*/)) props[key] = parseFloat(val);
    else if (val.match(/0-9/)) props[key] = parseInt(val, 10);
  }

  return props;
}

const rehypeCDNVideo = () => (tree: HastRoot) => {
  visit(tree, 'element', (node: Element, index, parent) => {
    if (
      !parent ||
      index === undefined ||
      node.tagName !== 'video' ||
      !node.properties.src?.toString().match(/\.json$/)
    ) {
      return;
    }

    const manifests = import.meta.glob<MediaManifest>('../../videos/*.json', {
      import: 'default',
      eager: true,
    });

    if (typeof node.properties.src !== 'string')
      throw new Error('src must be a string!');

    const slug = path.basename(node.properties.src, '.json');
    const data = Object.values(manifests).find((m) => m.slug === slug);
    if (!data) throw new Error(`Could not find manifest for slug ${slug}`);
    const manifest = MediaManifest.parse(data);

    const plus = manifest.variants.find((v) => v.label.includes('+'));
    const largest =
      plus ?? manifest.variants.sort((a, b) => b.height - a.height).at(0);

    if (!largest) throw new Error(`No largest variant for ${slug}`);

    const nextProps = coerceHTMLLikeProperties({ ...node.properties });
    delete nextProps.src;

    const video = h(
      'video',
      {
        controls: true,
        playsInline: true,
        preload: 'metadata',
        style: {
          'aspect-ratio': `${String(largest.width)} / ${String(largest.height)}`,
          width: '100%',
        },
        ...nextProps,
      },
      h('source', {
        src: cdnUrl(largest.pathName),
        type: largest.contentType,
      }),
    );

    const figure = h('figure', {}, video, h('figcaption', node.children));

    const next = node.children.length > 0 ? figure : video;
    parent.children.splice(index, 1, next);
    return [SKIP, index + 1];
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

function buildHTMLProcessor(posts: PostMeta[]) {
  return unified()
    .use(rehypeParse)
    .use(rehypePostLinks(posts))
    .use(rehypeStringify);
}

function buildMarkdownProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkExtractFrontmatter)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeReactComponents, {
      components: {
        // tag-name : TagName
      },
    })
    .use(rehypeCDNVideo)
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
  proc: ReturnType<typeof buildMarkdownProcessor>,
): Promise<RenderedPost> {
  const file = await proc.process(contents);
  if (!file.data.frontmatter)
    throw new Error(`Processed frontmatter missing for ${filename}`);
  const fm = postFrontmatterSchema.parse(file.data.frontmatter);
  const parsed = parsePostFilename(filename);
  if (parsed.error) throw parsed.error;

  const date = fm.date ?? `${parsed.year}-${parsed.month}-${parsed.day}`;

  const permalinks =
    typeof fm.permalinks === 'string'
      ? [fm.permalinks]
      : fm.permalinks && fm.permalinks.length > 0
        ? fm.permalinks
        : [`/p/${parsed.slug}`];

  permalinks.map((l) => (l.startsWith('/') ? l : `/${l}`));

  const url = permalinks.at(0);
  if (!url) throw new Error('Cannot happen: no permalinks to post');

  return {
    filename: path.basename(filename),
    slug: parsed.slug,

    url,
    permalinks,

    title: fm.title,
    date,
    categories: fm.categories ?? [],
    tags: fm.tags ?? [],
    oneliner: fm.oneliner ?? '',
    projecturl: fm.projecturl ?? '',
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    image: fm.image ?? [],
    contentHtml: String(file.value),
  };
}
