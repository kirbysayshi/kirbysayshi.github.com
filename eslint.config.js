import markdown from "@eslint/markdown";
import tseslint from "typescript-eslint";
import frontmatterSchema from "eslint-plugin-markdown-frontmatter-schema";
import postSchema from "./schemas/post-meta.schema.gen.json" with { type: "json" };

export default [
  ...tseslint.configs.recommended,
  {
    ignores: [
      "build/**",
      "node_modules/**",
      "vendor/**",
      "public/scripts/**",
      "public/flash/**",
      ".react-router/**",
    ],
  },
  // Markdown language for .md with YAML frontmatter support
  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/commonmark",
    languageOptions: { frontmatter: "yaml" },
  },
  // Same for .markdown extension
  {
    files: ["**/*.markdown"],
    plugins: { markdown },
    language: "markdown/commonmark",
    languageOptions: { frontmatter: "yaml" },
  },
  // Frontmatter schema validation for _posts
  {
    files: ["_posts/**/*.md", "_posts/**/*.markdown"],
    plugins: { "frontmatter-schema": frontmatterSchema },
    rules: {
      "frontmatter-schema/frontmatter-schema": [
        "error",
        { defaultSchema: postSchema },
      ],
    },
  },
];
