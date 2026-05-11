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
import remarkStringify from 'remark-stringify';
import { type Plugin, unified } from 'unified';
import { SKIP, visit } from 'unist-util-visit';
import { parse } from 'yaml';

import { cdnUrl, MediaManifest } from './media.js';
import {
  type PostMeta,
  postMetaSchema,
  type RenderedPost,
} from './post.schema.js';
import { rehypeReactComponents } from './rehype-react-components.js';

type VFile = ReturnType<(typeof unified)['processSync']>;

type VFileWithFrontmatter = VFile & {
  data: {
    frontmatter: Record<string, unknown>;
  };
};

type UnrenderedPost = { meta: PostMeta; contents: string };

let CACHED: null | RenderedPost[] = null;
const CATS = new Map<string, { name: string; slug: string; url: string }>(); // slug is key
const TAGS = new Map<string, { name: string; slug: string; url: string }>(); // slug is key

export async function getAllPosts(): Promise<RenderedPost[]> {
  if (CACHED) return CACHED;
  const rawPosts = import.meta.glob<string>('../../_posts/*.{md,markdown}', {
    query: '?raw',
    import: 'default',
    eager: true,
  });

  const unrendereds: UnrenderedPost[] = [];
  const metas: PostMeta[] = [];
  const fmProc = buildFrontmatterExtractor();
  const mkProc = buildMarkdownProcessor();
  const htmlProc = buildHTMLProcessor(metas);
  for (const [filepath, contents] of Object.entries(rawPosts)) {
    const fm = (await fmProc.process(contents)) as VFileWithFrontmatter;
    const filename = path.basename(filepath);
    const meta = postMetaSchema.parse({ filename, fm: fm.data.frontmatter });
    unrendereds.unshift({ meta, contents });
    metas.push(meta);
    for (const cat of meta.categories) CATS.set(cat.slug, cat);
    for (const tag of meta.tags) TAGS.set(tag.slug, tag);
  }

  const posts: RenderedPost[] = [];
  for (const meta of unrendereds) {
    const results0 = (await mkProc.process(meta.contents)).value.toString();
    const results1 = (await htmlProc.process(results0)).value.toString();
    const post: RenderedPost = {
      ...meta.meta,
      contentHtml: results1,
    };
    posts.unshift(post);
  }

  // Probably not necessary, should already be in filesystem order.
  posts.sort((a, b) => b.date.localeCompare(a.date));
  CACHED = posts;
  return posts;
}

export async function getPostsByTagSlug(slug: string) {
  const posts = await getAllPosts();
  const filtered = posts.filter((p) => p.tags.some((t) => t.slug === slug));
  const info = TAGS.get(slug);
  if (!info) throw new Error(`No tag name for slug ${slug}`);
  return { posts: filtered, info };
}

export async function getPostsByCategorySlug(slug: string) {
  const posts = await getAllPosts();
  const filtered = posts.filter((p) =>
    p.categories.some((c) => c.slug === slug),
  );
  const info = CATS.get(slug);
  if (!info) throw new Error(`No cat name for slug ${slug}`);
  return { posts: filtered, info: info };
}

export function getAllTags(): Readonly<typeof TAGS> {
  return TAGS;
}

export function getAllCats(): Readonly<typeof CATS> {
  return CATS;
}

// Rewrite markdown file links YYYY-MM-DD-slug.md to the canonical post url.
const rehypePostLinks = (metas: PostMeta[]) => () => (tree: HastRoot) => {
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
    const target = metas.find((p) => p.filename === filename);
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

function buildHTMLProcessor(metas: PostMeta[]) {
  return unified()
    .use(rehypeParse)
    .use(rehypePostLinks(metas))
    .use(rehypeStringify);
}

function buildFrontmatterExtractor() {
  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkExtractFrontmatter)
    .use(remarkStringify);
}

function buildMarkdownProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
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
