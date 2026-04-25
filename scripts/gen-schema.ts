import { writeFileSync } from 'fs';
import path from 'path';
import { z } from 'zod';

import { postFrontmatterSchema } from '../app/lib/post-meta.schema.js';

const schema = z.toJSONSchema(postFrontmatterSchema, { target: 'draft-7' });
const dest = new URL(
  path.join(
    path.dirname(import.meta.resolve('../app/lib/post-meta.schema.js')),
    'post-meta.schema.gen.json',
  ),
);

writeFileSync(dest, JSON.stringify(schema, null, 2) + '\n', {
  encoding: 'utf-8',
  flag: 'w',
});
console.log(`${dest} written`);
