import { z } from 'zod';

const CategoriesSchema = z.enum([
  // OK to add here, just trying to keep them well-known! Usually a post has 1
  // or 2, but lots of tags.
  'Blabbering Musings',
  'Elegant Code',
  'else',
  'Experiments',
  'flash',
  'Future Hopes',
  'Game Design',
  'Games',
  'in progress',
  'JavaScript',
  'Opinion',
  'Recipes',
  'Reviews',
  'Snippets',
  'Stories',
  'Talks',
  'Tools',
  'TypeScript',
  'web',
]);

/**
 * This is effectively what can be on-disk per-post.
 */
const postFrontmatterSchema = z.strictObject({
  title: z.string(),
  /** If present, overrides the visible date. */
  date: z.iso.date().optional(),
  categories: z
    .array(CategoriesSchema)
    .nullish()
    .transform((v) => v ?? []),
  tags: z
    .array(z.string())
    .nullish()
    .transform((v) => v ?? []),
  oneliner: z.string().nullish(),
  projecturl: z.string().nullish(),
  permalinks: z
    .string()
    .or(z.array(z.string()))
    .optional()
    .transform((inc) => (!inc ? [] : typeof inc === 'string' ? [inc] : inc)),
  /** @deprecated really only for very old posts */
  image: z
    .array(z.object({ src: z.string(), alt: z.string() }))
    .nullish()
    .transform((v) => v ?? []),
});

export const postMetaSchema = z
  .strictObject({
    filename: z.templateLiteral([
      z.iso.date(),
      z.literal('-'),
      z.stringFormat('slug', /[a-z0-9-]+/),
      z.enum(['.md', '.markdown']),
    ]),
    fm: postFrontmatterSchema,
  })
  .transform((inc, ctx) => {
    // filename -> date, slug
    const parts = /^(.{10})-([^.]+)/.exec(inc.filename);
    if (!parts) {
      ctx.addIssue({
        code: 'custom',
        message: 'invalid filename',
        path: ['filename'],
      });
      return z.NEVER;
    }
    const dateSlug = {
      date: parts[1] as string,
      slug: parts[2] as string,
    };

    if (inc.fm.permalinks.length === 0) {
      inc.fm.permalinks.push(`/p/${dateSlug.slug}`);
    }

    const permalinks = inc.fm.permalinks.map((l) =>
      l.startsWith('/') ? l : `/${l}`,
    );

    const url = inc.fm.permalinks.at(0);
    if (!url) {
      ctx.addIssue({
        code: 'custom',
        message: 'no permalinks',
        path: ['permalinks'],
      });
      return z.NEVER;
    }

    const categories = inc.fm.categories.map((cat) => {
      const slug = z.string().slugify().parse(cat);
      return {
        name: cat,
        slug,
        url: `/category/${encodeURIComponent(slug)}`,
      };
    });

    const tags = inc.fm.tags.map((cat) => {
      const slug = z.string().slugify().parse(cat);
      return {
        name: cat,
        slug,
        url: `/tag/${encodeURIComponent(slug)}`,
      };
    });

    return {
      ...inc.fm,
      filename: inc.filename,
      ...dateSlug,
      permalinks,
      url,
      categories,
      tags,
    };
  });

export type PostMeta = z.infer<typeof postMetaSchema>;

export type RenderedPost = PostMeta & {
  contentHtml: string;
};
