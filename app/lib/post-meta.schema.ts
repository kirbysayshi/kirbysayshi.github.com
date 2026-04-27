/**
 * Ok to add more! Each post usually has one or two.
 */
export type PostCategory =
  | 'Blabbering Musings'
  | 'Elegant Code'
  | 'else'
  | 'Experiments'
  | 'flash'
  | 'Future Hopes'
  | 'Game Design'
  | 'Games'
  | 'in progress'
  | 'JavaScript'
  | 'Opinion'
  | 'Recipes'
  | 'Reviews'
  | 'Snippets'
  | 'Stories'
  | 'Talks'
  | 'Tools'
  | 'TypeScript'
  | 'web';

export type PostFrontmatter = {
  title: string;
  published?: boolean;
  categories?: PostCategory[];
  tags?: string[];
  oneliner?: string | null;
  projecturl?: string | null;
  image?: { src: string; alt: string }[] | null;
};
