import { PostList, type PostItem } from "./_includes/components/PostList.tsx";

interface IndexData {
  collections: { posts: PostItem[] };
}

export default class Index {
  data() {
    return {
      layout: "layouts/default.11ty.tsx",
      title: "Hi.",
      classname: "page-home",
    };
  }

  render(data: IndexData) {
    return (
      <>
        <h1 className="lined-block col span_6">Showing All Posts</h1>
        <PostList posts={data.collections.posts} />
      </>
    );
  }
}
