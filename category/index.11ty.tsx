import { PostList, type PostItem } from "../_includes/components/PostList.tsx";

interface CategoryEntry {
  name: string;
  slug: string;
  posts: PostItem[];
}

interface CategoryData {
  currentCategory: CategoryEntry;
}

export default class CategoryPage {
  data() {
    return {
      layout: "layouts/default.11ty.tsx",
      classname: "page-home",
      pagination: {
        data: "collections.categoriesList",
        size: 1,
        alias: "currentCategory",
      },
      eleventyComputed: {
        title: (data: { currentCategory?: CategoryEntry }) =>
          `Posts in ${data.currentCategory?.name ?? ""} category`,
      },
      permalink: (data: { currentCategory?: CategoryEntry }) =>
        `/category/${data.currentCategory?.slug ?? "unknown"}.html`,
    };
  }

  render(data: CategoryData) {
    const { currentCategory } = data;
    return (
      <>
        <h1 className="lined-block col span_6">
          Showing Posts in {currentCategory.name}
        </h1>
        <PostList posts={currentCategory.posts} />
      </>
    );
  }
}
