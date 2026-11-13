import { defineConfig } from 'oxfmt';
import base from '../oxfmt.base.mjs';

export default defineConfig({
  ...base,
  associations: [
    {
      files: ['**/*.html'],
      excludeFiles: ['**/index.html'],
      language: 'angular-html',
    },
  ],
  sortImports: {
    groups: ['builtin', 'external', 'internal', ['parent', 'sibling']],
    internalPattern: ['~/'],
  },
});
