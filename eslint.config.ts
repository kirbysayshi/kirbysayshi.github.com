import markdown from '@eslint/markdown';
import type { ESLint } from 'eslint';
import { defineConfig } from 'eslint/config';
import frontmatterSchema from 'eslint-plugin-markdown-frontmatter-schema';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

import postSchema from './app/lib/post-meta.schema.gen.json' with { type: 'json' };

function ignoreMD(c: (typeof tseslint)['configs']['base']) {
  return {
    ...c,
    ignores: ['**/*.md', '**/*.markdown'],
  };
}

export default defineConfig([
  ...tseslint.configs.strictTypeChecked.map((c) => ignoreMD(c)),
  ...tseslint.configs.stylistic.map((c) => ignoreMD(c)),
  {
    // no type information for markdown
    ignores: ['**/*.md', '**/*.markdown'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      // I just find `type` more useful/versatile, `interface` is better for OOP
      // or when you need interface merging.
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/only-throw-error': ['error', { allow: ['Response'] }],
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
    files: ['**/*.md', '**/*.markdown'],

    // See:
    // - https://github.com/eslint/markdown/pull/648
    // - https://github.com/eslint/json/issues/213
    plugins: { markdown } as Record<string, ESLint.Plugin>,
    language: 'markdown/commonmark',
    languageOptions: { frontmatter: 'yaml' },
  },

  {
    files: ['_posts/**/*.md', '_posts/**/*.markdown'],
    plugins: { 'frontmatter-schema': frontmatterSchema },
    rules: {
      'frontmatter-schema/frontmatter-schema': [
        'error',
        { defaultSchema: postSchema },
      ],
    },
  },
]);
