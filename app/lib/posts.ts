import type { MDXContent, MDXModule } from 'mdx/types.js';

import type { PostFrontmatter } from './post-meta.schema.js';

export type Post = {
  slug: string;
  url: string;
  date: string;
  title: PostFrontmatter['title'];
  categories: NonNullable<PostFrontmatter['categories']>;
  tags: NonNullable<PostFrontmatter['tags']>;
  oneliner: NonNullable<PostFrontmatter['oneliner']> | null;
  projecturl: NonNullable<PostFrontmatter['projecturl']>;
  image: NonNullable<PostFrontmatter['image']>;
  Cmp: MDXContent;
};

type PostModule = { meta: PostFrontmatter; default: MDXContent };

function isPostModule(mod: MDXModule): mod is PostModule {
  if ('meta' in mod) return true;
  return false;
}

export async function getAllPosts(rr7cc = false): Promise<Post[]> {
  const posts: Post[] = [];

  // rr7cc: "react-router 7 config context" aka this is being called from
  // react-router's internal vite instance used to evaluate the
  // react-router.config.ts file, which _ignores_ vite.config.ts, thus ignoring
  // our mdx plugin. Instead, do it ourselves since we need `meta`.

  if (rr7cc) {
    const rawPosts = import.meta.glob<string>('../../_posts/*.mdx', {
      query: '?raw',
      import: 'default',
    });
    const mdxMod = await import('@mdx-js/mdx');
    const jsxMod = await import('react/jsx-runtime');
    for (const [filepath, load] of Object.entries(rawPosts)) {
      const content = await load();
      const mod = await mdxMod.evaluate(content, jsxMod);
      if (!isPostModule(mod)) continue; // todo: warn?
      const post = postFrom(filepath, mod);
      if (!post) continue;
      posts.unshift(post);
    }
  } else {
    const postModules = import.meta.glob<PostModule>('../../_posts/*.mdx');
    for (const [filepath, load] of Object.entries(postModules)) {
      const mod = await load();
      const post = postFrom(filepath, mod);
      if (!post) continue;
      posts.unshift(post);
    }
  }

  // Probably not necessary, should already be in filesystem order.
  posts.sort((a, b) => b.date.localeCompare(a.date));
  return posts;
}

export function postFrom(filepath: string, mod: PostModule): Post | null {
  if (mod.meta.published === false) return null;

  const parsed = parsePostFilename(filepath);
  if (parsed.error) throw parsed.error;

  return {
    slug: parsed.slug,
    url: `/${parsed.year}/${parsed.month}/${parsed.day}/${parsed.slug}.html`,
    title: mod.meta.title,
    date: `${parsed.year}-${parsed.month}-${parsed.day}`,
    categories: mod.meta.categories ?? [],
    tags: mod.meta.tags ?? [],
    oneliner: mod.meta.oneliner ?? '',
    projecturl: mod.meta.projecturl ?? '',
    image: mod.meta.image ?? [],
    Cmp: mod.default,
  };
}

/** Jekyll behavior: lowercase + spaces to hyphens */
export function slugify(str?: string) {
  return str?.toLowerCase().replace(/\s+/g, '-') ?? '';
}

type ParsedFilename =
  | { error: null; year: string; month: string; day: string; slug: string }
  | { error: Error };

export function parsePostFilename(name: string): ParsedFilename {
  const match =
    name.match(/\/?(\d{4})-(\d{2})-(\d{2})-(.+)\.(md|markdown|mdx)$/) ?? [];
  const [, year, month, day, rawSlug] = match;
  const slug = slugify(rawSlug);

  const out = {
    year: year ?? '',
    month: month ?? '',
    day: day ?? '',
    slug,
    error: null as null | Error,
  };

  if (!year || !month || !day || !rawSlug) {
    out.error = new Error(
      `InvalidPostFileName: unable to parse [YYYY, MM, DD, slug] got: ${[year, month, day, rawSlug].join(', ')} from ${name}`,
    );
  }

  return out;
}
