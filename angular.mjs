import { defineConfig, globalIgnores } from 'eslint/config';
import eslint from '@eslint/js';
import angular from 'angular-eslint';
import jsdoc from 'eslint-plugin-jsdoc';
import prettierPluginRecommended from 'eslint-plugin-prettier/recommended';
import tsEslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';

export default defineConfig([
  globalIgnores(['.cache/', '.git/', '.github/', 'node_modules/', 'dist/', '.angular/']),
  prettierPluginRecommended,
  {
    name: 'sources',
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tsEslint.configs.recommended,
      tsEslint.configs.stylistic,
      angular.configs.tsRecommended,
      jsdoc.configs['flat/recommended'],
    ],
    plugins: {
      import: importPlugin,
      'unused-imports': unusedImportsPlugin,
    },
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/member-ordering': ['error'],
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unused-vars': 'off',

      '@angular-eslint/no-output-on-prefix': 'error',

      'jsdoc/check-tag-names': ['warn', { definedTags: ['usageNotes', 'output'] }],
      'jsdoc/require-param': 'off',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-returns-type': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/require-property-type': 'off',
      'jsdoc/no-undefined-types': 'off',
      'jsdoc/check-param-names': 'off',
      'jsdoc/tag-lines': 'off',

      'max-params': ['error', { max: 3 }],
      'array-element-newline': 'off',
      'no-unused-vars': 'off',
      curly: ['error', 'all'],

      'import/no-duplicates': ['error', { 'prefer-inline': true }],
      'import/order': [
        'error',
        {
          pathGroups: [{ pattern: '~/**', group: 'internal' }],
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling'],
          'newlines-between': 'always',
        },
      ],

      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|err)$',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    name: 'templates',
    files: ['**/*.html'],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
  },
]);
