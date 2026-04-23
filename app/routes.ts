import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route(":year/:month/:day/:slug.html", "routes/post.tsx"),
  route("tag/:slug.html", "routes/tag.tsx"),
  route("category/:slug.html", "routes/category.tsx"),
  route("feed.xml", "routes/feed.xml.tsx"),
  route("404.html", "routes/404.tsx"),
] satisfies RouteConfig;
