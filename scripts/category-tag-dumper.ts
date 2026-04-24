import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { default as FM } from 'front-matter';

// Dump all categories and tags

const tags = new Set<string>();
const cats = new Set<string>();

for (const name of readdirSync("_posts")) {
  const full = join("_posts", name);
  if (name.endsWith(".md") || name.endsWith('.markdown')) {
    const content = readFileSync(full, { encoding: 'utf8' });
    const fm = FM<{ categories: string[] | undefined, tags?: string[] }>(content);
    for (const cat of fm.attributes.categories ?? []) cats.add(cat);
    for (const tag of fm.attributes.tags ?? []) tags.add(tag);
  }
}

console.dir(tags, { depth: Infinity, maxArrayLength: Infinity });
console.dir(cats, { depth: Infinity, maxArrayLength: Infinity });