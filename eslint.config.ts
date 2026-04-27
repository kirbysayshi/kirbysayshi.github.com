import { defineConfig } from 'eslint/config';
import * as mdx from 'eslint-plugin-mdx';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

function ignoreMDX(c: (typeof tseslint)['configs']['base']) {
  return {
    ...c,
    ignores: ['**/*.mdx'],
  };
}

export default defineConfig([
  ...tseslint.configs.strictTypeChecked.map((c) => ignoreMDX(c)),
  ...tseslint.configs.stylistic.map((c) => ignoreMDX(c)),
  {
    ignores: ['**/*.mdx'],
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
    files: ['_posts/**/*.mdx', '**/*.mdx'],
    ...mdx.flat,
  },
]);
