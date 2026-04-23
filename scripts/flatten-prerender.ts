import { readdirSync, statSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

// React-router prerenders any URL ending in .html into a directory named
// slug.html/ containing index.html. Convert them to flat files so slug.html
// resolves directly to a file without the trailing `/` (slug.html/). This might
// not be necessary in practice.
function flatten(dir: string) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (!stat.isDirectory()) continue;
    if (name.endsWith(".html")) {
      const indexFile = join(full, "index.html");
      const content = readFileSync(indexFile);
      rmSync(full, { recursive: true });
      writeFileSync(full, content);
    } else {
      flatten(full);
    }
  }
}

flatten("build/client");
console.log("Flattened .html directory pre-renders to flat files.");
