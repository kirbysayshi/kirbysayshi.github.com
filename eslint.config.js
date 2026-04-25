import markdown from '@eslint/markdown';
import frontmatterSchema from 'eslint-plugin-markdown-frontmatter-schema';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

import postSchema from './schemas/post-meta.schema.gen.json' with { type: 'json' };

export default [
  ...tseslint.configs.recommended,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },
  {
    ignores: [
      'build/**',
      'node_modules/**',
      'vendor/**',
      'public/scripts/**',
      'public/flash/**',
      '.react-router/**',
    ],
  },

  {
    // General Markdown + YAML frontmatter
    files: ['**/*.md', '**/*.markdown'],
    plugins: { markdown },
    language: 'markdown/commonmark',
    languageOptions: { frontmatter: 'yaml' },
  },

  {
    // frontmatter schema linting specifically for posts
    files: ['_posts/**/*.md', '_posts/**/*.markdown'],
    plugins: { 'frontmatter-schema': frontmatterSchema },
    rules: {
      'frontmatter-schema/frontmatter-schema': [
        'error',
        { defaultSchema: postSchema },
      ],
    },
  },
];
