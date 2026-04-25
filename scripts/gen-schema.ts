import { mkdirSync, writeFileSync } from 'fs';
import { z } from 'zod';

import { postFrontmatterSchema } from '../app/lib/post-meta.schema.js';

mkdirSync('schemas', { recursive: true });
const schema = z.toJSONSchema(postFrontmatterSchema, { target: 'draft-7' });
writeFileSync(
  'schemas/post-meta.schema.gen.json',
  JSON.stringify(schema, null, 2) + '\n',
);
console.log('schemas/post-meta.schema.gen.json written');
