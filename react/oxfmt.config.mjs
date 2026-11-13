import { defineConfig } from 'oxfmt';
import base from '../oxfmt.base.mjs';

export default defineConfig({
  ...base,
  sortImports: {
    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
    internalPattern: ['common/', 'features/', 'locales', 'models/', 'pages', 'permissions', 'types/', 'ui'],
    newlinesBetween: false,
  },
});
