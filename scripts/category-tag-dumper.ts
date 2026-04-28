import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

// Dump all categories and tags

const tags = new Set<string>();
const cats = new Set<string>();

for (const name of readdirSync('_posts')) {
  const full = join('_posts', name);
  if (name.endsWith('.md') || name.endsWith('.markdown')) {
    const content = readFileSync(full, { encoding: 'utf8' });
    const parts = content.split('---');
    const fm = parse(parts[1] ?? '') as {
      categories?: string[];
      tags?: string[];
    };
    for (const cat of fm.categories ?? []) cats.add(cat);
    for (const tag of fm.tags ?? []) tags.add(tag);
  }
}

console.dir(tags, { depth: Infinity, maxArrayLength: Infinity });
console.dir(cats, { depth: Infinity, maxArrayLength: Infinity });
