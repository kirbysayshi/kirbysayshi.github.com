import type { EleventySuppliedData } from "11ty.ts";
import type { SiteData } from "./_includes/types.ts";

type FeedPost = EleventySuppliedData & { data: { title: string }; templateContent?: string };

interface FeedData {
  collections: { posts: FeedPost[] };
  site: SiteData;
}

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default class Feed {
  data() {
    return {
      permalink: "/feed.xml",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data: FeedData) {
    const posts = data.collections.posts.slice(0, 10);
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(data.site.title)}</title>
    <description>${escapeXml(data.site.description)}</description>
    <link>${data.site.url}</link>
    ${posts
      .map(
        (post) => `<item>
      <title>${escapeXml(post.data.title)}</title>
      <description>${escapeXml(post.templateContent ?? "")}</description>
      <published>${post.date.toISOString()}</published>
      <link>${data.site.url}${post.url}</link>
    </item>`
      )
      .join("\n    ")}
  </channel>
</rss>`;
  }
}
