import { getAllPosts, slugify } from "../lib/posts";
import { PostList } from "./home";
import type { Route } from "./+types/category";

export const handle = { classname: "page-home" };

export async function loader({ params }: Route.LoaderArgs) {
  const { slug } = params;
  const posts = await getAllPosts();
  const catPosts = posts.filter((p) =>
    p.categories.some((c) => slugify(c) === slug)
  );
  const catName =
    catPosts[0]?.categories.find((c) => slugify(c) === slug) ?? slug ?? "";
  return { catPosts, catName };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: `Posts in ${data?.catName} — KSH` }];
}

export default function Category({ loaderData }: Route.ComponentProps) {
  const { catPosts, catName } = loaderData;
  return (
    <>
      <h1 className="lined-block col span_6">
        Showing Posts in {catName}
      </h1>
      <PostList posts={catPosts} />
    </>
  );
}
