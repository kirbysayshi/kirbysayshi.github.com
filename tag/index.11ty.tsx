import { PostList, type PostItem } from "../_includes/components/PostList.tsx";

interface TagEntry {
  name: string;
  slug: string;
  posts: PostItem[];
}

interface TagData {
  currentTag: TagEntry;
}

export default class TagPage {
  data() {
    return {
      layout: "layouts/default.11ty.tsx",
      classname: "page-home",
      pagination: {
        data: "collections.tagsList",
        size: 1,
        alias: "currentTag",
      },
      eleventyComputed: {
        title: (data: { currentTag?: TagEntry }) =>
          `Posts Tagged With ${data.currentTag?.name ?? ""}`,
      },
      permalink: (data: { currentTag?: TagEntry }) =>
        `/tag/${data.currentTag?.slug ?? "unknown"}.html`,
    };
  }

  render(data: TagData) {
    const { currentTag } = data;
    return (
      <>
        <h1 className="lined-block col span_6">
          Showing Posts Tagged With {currentTag.name}
        </h1>
        <PostList posts={currentTag.posts} />
      </>
    );
  }
}
