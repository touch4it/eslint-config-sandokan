import { defineConfig } from 'eslint/config';
import angular from 'angular-eslint';

export default defineConfig([
  {
    name: 'templates',
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
  },
]);
