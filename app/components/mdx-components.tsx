import type { JSX } from 'react';

import { parsePostFilename } from '../lib/posts.js';

export const mdxComponents = {
  a({ href, children, ...props }: JSX.IntrinsicElements['a']) {
    return (
      <a href={rewritePostLink(href)} {...props}>
        {children}
      </a>
    );
  },
};

function rewritePostLink(href?: string) {
  if (!href) return href;
  if (href.startsWith('/') || /^[a-z][a-z+\-.]*:/i.test(href)) return href;
  const parsed = parsePostFilename(href);
  if (parsed.error) return href;
  return `/${parsed.year}/${parsed.month}/${parsed.day}/${parsed.slug}.html`;
}
