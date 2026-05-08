import type { Element, Root } from 'hast';
import { fromHtml } from 'hast-util-from-html';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { type ComponentType, Fragment, type ReactNode } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { SKIP, visit } from 'unist-util-visit';

// `hast-util-to-jsx-runtime`'s `Components` uses `any` too, such a bummer :/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentMap = Record<string, ComponentType<any>>;

export function rehypeReactComponents(options: { components: ComponentMap }) {
  const { components } = options;

  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      const Component = components[node.tagName];
      if (!Component || index == null || parent == null) return;

      const subtree: Root = { type: 'root', children: node.children };
      const opts = { Fragment, jsx, jsxs, components };
      const children = toJsxRuntime(subtree, opts) as ReactNode;

      const html = renderToStaticMarkup(
        <Component {...node.properties}>{children}</Component>,
      );

      const fragment = fromHtml(html, { fragment: true });
      parent.children.splice(index, 1, ...fragment.children);
      return [SKIP, index + fragment.children.length];
    });
  };
}
