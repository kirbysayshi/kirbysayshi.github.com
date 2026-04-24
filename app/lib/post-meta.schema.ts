import { z } from "zod";

export const postFrontmatterSchema = z.object({
  title: z.string(),
  // TODO: remove this or actually use it. holdover from jekyll.
  layout: z.enum(['post']).optional(),
  published: z.boolean().optional(),
  categories: z.array(z.enum([
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
  ])).optional(),
  tags: z.array(z.string()).optional(),
  oneliner: z.string().nullish(),
  type: z.enum(["post", "project"]).optional(),
  projecturl: z.string().nullish(),
  image: z
    .array(z.object({ src: z.string(), alt: z.string() }))
    .nullable()
    .optional(),
});

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;
