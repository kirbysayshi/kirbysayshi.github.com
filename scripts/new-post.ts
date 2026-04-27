import { existsSync, writeFileSync } from 'fs';
import path from 'path';

const title = process.argv[2];
if (!title) {
  console.error('Usage: pnpm new-post "My Post Title"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const date = new Date().toISOString().slice(0, 10);
const filename = `${date}-${slug}.mdx`;
const dest = path.resolve(import.meta.dirname, '../_posts', filename);

if (existsSync(dest)) {
  console.error(`Already exists: ${dest}`);
  process.exit(1);
}

const template = `{/** @type {import("../app/lib/post-meta.schema").PostFrontmatter} */}

export const meta = {
  title: ${JSON.stringify(title)},
  published: false,
  oneliner: '',
  categories: [],
  tags: [],
};

`;

writeFileSync(dest, template, { encoding: 'utf-8' });
console.log(`Created: ${dest}`);
