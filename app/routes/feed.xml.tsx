import { getAllPosts } from '../lib/posts';

export async function loader() {
  const posts = await getAllPosts();
  const recent = posts.slice(0, 10);
  const xml = buildRssXml(recent);
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}

function escape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildRssXml(posts: Awaited<ReturnType<typeof getAllPosts>>): string {
  const items = posts
    .map(
      (p) => `  <item>
    <title>${escape(p.title)}</title>
    <description>${escape(p.contentHtml)}</description>
    <link>https://kirbysayshi.github.com${p.url}</link>
  </item>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>KSH</title>
    <description>Thoughts, posts, and projects by KirbySaysHi (Andrew Petersen)</description>
    <link>//kirbysayshi.github.com</link>
${items}
  </channel>
</rss>`;
}
