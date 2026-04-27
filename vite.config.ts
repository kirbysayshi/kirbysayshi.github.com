import fs from 'node:fs';
import path from 'node:path';

import mdx from '@mdx-js/rollup';
import { reactRouter } from '@react-router/dev/vite';
import rehypeShiki from '@shikijs/rehype';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        rehypePlugins: [[rehypeShiki, { theme: 'light-plus', fallbackLanguage: 'text' }]],
      }),
    },
    {
      // This is specifically to simulate ghpages' ability to default load
      // index.html, which happens for the old old flash files :)
      name: 'serve-public-index',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0];
          if (!url) {
            next();
            return;
          }
          const candidate = path.join(
            process.cwd(),
            'public',
            url,
            'index.html',
          );
          if (fs.existsSync(candidate)) {
            res.setHeader('Content-Type', 'text/html');
            fs.createReadStream(candidate).pipe(res);
            return;
          }
          next();
        });
      },
    },
    reactRouter(),
  ],
});
