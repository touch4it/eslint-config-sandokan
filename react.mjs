import tseslint from 'typescript-eslint';
import eslintCommentsPlugin from '@eslint-community/eslint-plugin-eslint-comments';
import promisePlugin from 'eslint-plugin-promise';
import importPlugin from 'eslint-plugin-import-x';
import unicornPlugin from 'eslint-plugin-unicorn';
import xoPluginOriginal from 'eslint-config-xo';
import xoTsPluginOriginal from 'eslint-config-xo-typescript';
import xoBrowser from 'eslint-config-xo/browser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tanstackQueryPlugin from '@tanstack/eslint-plugin-query';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y-x';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import regexpPlugin from 'eslint-plugin-regexp';
import jestPlugin from 'eslint-plugin-jest';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import prettierPlugin from 'eslint-plugin-prettier/recommended';
import eslint from '@eslint/js';
import perfectionist from 'eslint-plugin-perfectionist';

/*
Workaround for this error

```
Oops! Something went wrong! :(

ESLint: 9.38.0

TypeError: Key "languageOptions": allowTrailingCommas option is only available in JSONC.
```
*/
const omit = (property, { [property]: _, ...object }) => object;

const xoPlugin = xoPluginOriginal.map((config) =>
  config.languageOptions?.allowTrailingCommas
    ? { ...config, languageOptions: omit('allowTrailingCommas', config.languageOptions) }
    : config,
);

const xoTsPlugin = xoTsPluginOriginal.map((config) =>
  config.languageOptions?.allowTrailingCommas
    ? { ...config, languageOptions: omit('allowTrailingCommas', config.languageOptions) }
    : config,
);

/*
Workaround for this error

```
TypeError: Error while loading rule 'no-irregular-whitespace': sourceCode.getAllComments is not a function
```
*/
const xoTsFiltered = xoTsPlugin.filter((config) => !config.language?.startsWith('json/'));

const xoFiltered = xoPlugin.filter((config) => !config.language?.startsWith('json/'));

const allOurSelectors = [
  'function',
  'classProperty',
  'objectLiteralProperty',
  'parameterProperty',
  'classMethod',
  'objectLiteralMethod',
  'typeMethod',
  'accessor',
];

const ourShortcuts = '^.*UTC.*$|^.*URL.*$|^.*DOP.*$|^.*DOC.*^';
const booleanPrefixes = ['is', 'has', 'can', 'should', 'will', 'did'];

const getNamingConventionRule = ({ isTsx }) => ({
  '@typescript-eslint/naming-convention': [
    'error',
    {
      // Note: Leaving out `parameter` and `typeProperty` because of the mentioned known issues.
      // Note: We are intentionally leaving out `enumMember` as it's usually pascal-case or upper-snake-case.
      selector: allOurSelectors,
      format: ['strictCamelCase', ...(isTsx ? ['StrictPascalCase'] : [])],
      // We allow double underscore because of GraphQL type names and some React names.
      leadingUnderscore: 'allowSingleOrDouble',
      trailingUnderscore: 'allow',
      // Ignore `{'Retry-After': retryAfter}` type properties.
      filter: {
        regex: `[- ]|^[0-9]+$|${ourShortcuts}`,
        match: false,
      },
    },
    {
      selector: 'typeLike',
      format: ['StrictPascalCase'],
    },
    {
      selector: 'variable',
      modifiers: ['const'],
      types: ['number', 'string'],
      filter: {
        regex: /^[A-Z]+(?:_[A-Z]+)*$/.source,
        match: true,
      },
      format: ['UPPER_CASE'],
    },
    {
      selector: 'variable',
      modifiers: ['const'],
      types: ['boolean'],
      filter: {
        regex: /^[A-Z]+(?:_[A-Z]+)*$/.source,
        match: true,
      },
      format: ['UPPER_CASE'],
      prefix: booleanPrefixes.map((prefix) => `${prefix.toUpperCase()}_`),
    },
    {
      selector: 'variable',
      types: ['boolean'],
      format: ['StrictPascalCase'],
      prefix: booleanPrefixes,
      // We allow double underscore because of GraphQL type names and some React names.
      leadingUnderscore: 'allowSingleOrDouble',
      trailingUnderscore: 'allow',
      // Ignore `{'Retry-After': retryAfter}` type properties.
      filter: {
        regex: `[- ]|^[0-9]+$|${ourShortcuts}`,
        match: false,
      },
    },
    {
      selector: 'variable',
      format: ['strictCamelCase', ...(isTsx ? ['StrictPascalCase'] : [])],
      // We allow double underscore because of GraphQL type names and some React names.
      leadingUnderscore: 'allowSingleOrDouble',
      trailingUnderscore: 'allow',
      // Ignore `{'Retry-After': retryAfter}` type properties.
      filter: {
        regex: `[- ]|^[0-9]+$|${ourShortcuts}`,
        match: false,
      },
    },
    {
      // Interface name should not be prefixed with `I`.
      selector: 'interface',
      filter: {
        regex: /^(?!I)[A-Z]/.source,
        match: true,
      },
      format: ['StrictPascalCase'],
    },
    {
      selector: 'typeParameter',
      filter: {
        regex: /^[A-Z][a-z][a-zA-Z]+$/.source,
        match: true,
      },
      format: ['StrictPascalCase'],
    },
    {
      selector: 'typeParameter',
      filter: {
        regex: /^T$|^[A-Z][a-zA-Z]+$/.source,
        match: true,
      },
      format: ['PascalCase'],
    },
    // Allow these in non-camel-case when quoted.
    {
      selector: ['classProperty', 'objectLiteralProperty'],
      format: null,
      modifiers: ['requiresQuotes'],
    },
    {
      selector: allOurSelectors,
      filter: {
        regex: ourShortcuts,
        match: true,
      },
      format: ['camelCase'],
    },
  ],
});

export default [
  {
    name: 'options',
    languageOptions: {
      globals: {
        document: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
        jest: 'readonly',
        expect: 'readonly',
        test: 'readonly',
        describe: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2022,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },

  eslint.configs.recommended,

  ...tseslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    name: '@eslint-community/eslint-plugin-eslint-comments',
    plugins: { '@eslint-community/eslint-comments': eslintCommentsPlugin },
    rules: eslintCommentsPlugin.configs.recommended.rules,
  },
  promisePlugin.configs['flat/recommended'],
  importPlugin.flatConfigs.recommended,
  unicornPlugin.configs.recommended,
  {
    name: 'xo',
    extends: xoFiltered,
  },
  {
    name: 'xo-ts',
    extends: xoTsFiltered,
  },
  {
    name: 'xo-browser',
    extends: xoBrowser,
  },
  {
    name: 'react',
    plugins: { react: reactPlugin },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
    },
  },
  {
    name: 'react-hooks',
    plugins: { 'react-hooks': reactHooksPlugin },
    rules: reactHooksPlugin.configs['recommended-latest'].rules,
  },
  ...tanstackQueryPlugin.configs['flat/recommended'],
  jsxA11yPlugin.configs.recommended,
  sonarjsPlugin.configs.recommended,
  {
    name: 'regexp',
    plugins: regexpPlugin.configs['flat/recommended'].plugins,
    rules: regexpPlugin.configs['flat/recommended'].rules,
  },
  {
    name: 'jest',
    files: ['**/?(*.)+(spec|test).[jt]s?(x)'],
    plugins: {
      jest: jestPlugin,
      'testing-library': testingLibraryPlugin,
    },
    settings: {
      jest: { version: 27 },
    },
    rules: {
      'sonarjs/no-duplicate-string': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'jest/unbound-method': 'error',
      'jest/max-nested-describe': [
        'error',
        {
          max: 5,
        },
      ],
      'jest/no-commented-out-tests': 'off',
      'jest/no-conditional-in-test': 'error',
      'jest/no-confusing-set-timeout': 'warn',
      'jest/no-duplicate-hooks': 'error',
      'jest/no-test-return-statement': 'warn',
      'jest/no-large-snapshots': 'error',
      'jest/no-untyped-mock-factory': 'warn',
      'jest/prefer-called-with': 'error',
      'jest/prefer-comparison-matcher': 'error',
      'jest/prefer-each': 'warn',
      'jest/prefer-equality-matcher': 'error',
      'jest/prefer-expect-resolves': 'error',
      'jest/prefer-hooks-in-order': 'error',
      'jest/prefer-hooks-on-top': 'error',
      'jest/prefer-jest-mocked': 'error',
      'jest/prefer-lowercase-title': ['error', { ignoreTopLevelDescribe: true }],
      'jest/prefer-mock-promise-shorthand': 'warn',
      'jest/prefer-spy-on': 'error',
      'jest/prefer-todo': 'error',
      'jest/require-hook': 'off',
      'jest/require-to-throw-message': 'error',
      'jest/require-top-level-describe': 'warn',
      'testing-library/prefer-explicit-assert': ['error', { assertion: 'toBeInTheDocument' }],
      'testing-library/no-test-id-queries': 'error',
      'testing-library/prefer-user-event-setup': 'error',
    },
  },
  prettierPlugin,
  {
    name: 'perfectionist',
    plugins: perfectionist.configs['recommended-alphabetical'].plugins,
    rules: perfectionist.configs['recommended-alphabetical'].rules,
  },
  {
    name: 'overrides',
    rules: {
      'no-array-constructor': 'off',
      '@typescript-eslint/no-array-constructor': 'warn',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'warn',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': [
        'warn',
        {
          functions: false,
          classes: false,
          variables: false,
          typedefs: false,
        },
      ],
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
        },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'prefer-destructuring': 'off',
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
      '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'warn',
      '@typescript-eslint/strict-void-return': 'error',
      '@typescript-eslint/no-invalid-void-type': 'warn',
      '@typescript-eslint/no-useless-empty-export': 'warn',
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'error' },
            { name: 'domain' },
            { name: 'freelist' },
            { name: 'smalloc' },
            { name: 'punycode' },
            { name: 'sys' },
            { name: 'querystring' },
            { name: 'colors' },
            { name: 'antd' },
            { name: '@mantine' },
          ],
          patterns: [
            { group: ['@mantine/*'], message: 'Import from @mantine is restricted' },
            { group: ['features/*/*'], message: 'Direct feature imports are restricted' },
          ],
        },
      ],
      ...getNamingConventionRule({ isTsx: false }),
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        {
          ignoreTernaryTests: false,
          ignoreConditionalTests: false,
          ignoreMixedLogicalExpressions: true,
        },
      ],
      '@typescript-eslint/consistent-type-definitions': 'off',

      '@typescript-eslint/object-curly-spacing': 'off',
      'padding-line-between-statements': 'off',
      '@typescript-eslint/padding-line-between-statements': 'off',
      '@typescript-eslint/no-import-type-side-effects': 'error',

      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: [
            {
              from: 'package',
              package: '@tanstack/router-core',
              name: 'Redirect',
            },
          ],
        },
      ],

      camelcase: 'off',
      'no-async-promise-executor': 'error',
      'no-param-reassign': 'error',
      'no-warning-comments': 'off',
      'array-callback-return': [
        'warn',
        {
          allowImplicit: true,
          checkForEach: false,
        },
      ],
      'capitalized-comments': [
        'warn',
        'always',
        {
          ignorePattern: /pragma|ignore|prettier-ignore|webpack\w+:|c8|type-coverage:/.source,
          ignoreInlineComments: true,
          ignoreConsecutiveComments: true,
        },
      ],
      // TypeScript's `noFallthroughCasesInSwitch` option is more robust (#6906)
      'default-case': 'off',
      // 'tsc' already handles this (https://github.com/typescript-eslint/typescript-eslint/issues/291)
      'no-dupe-class-members': 'off',
      // 'tsc' already handles this (https://github.com/typescript-eslint/typescript-eslint/issues/477)
      'no-undef': 'off',
      eqeqeq: ['warn', 'smart'],
      'no-caller': 'warn',
      'no-cond-assign': ['warn', 'except-parens'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-const-assign': 'warn',
      'no-control-regex': 'warn',
      'no-delete-var': 'warn',
      'no-dupe-args': 'warn',
      'no-dupe-keys': 'warn',
      'no-duplicate-case': 'warn',
      'no-empty-character-class': 'warn',
      'no-empty-pattern': 'warn',
      'no-eval': 'warn',
      'no-ex-assign': 'warn',
      'no-extend-native': 'warn',
      'no-extra-bind': 'warn',
      'no-extra-label': 'warn',
      'no-fallthrough': 'warn',
      'no-func-assign': 'warn',
      'no-implied-eval': 'warn',
      'no-invalid-regexp': 'warn',
      'no-iterator': 'warn',
      'no-label-var': 'warn',
      'no-labels': [
        'warn',
        {
          allowLoop: true,
          allowSwitch: false,
        },
      ],
      'no-lone-blocks': 'warn',
      'no-loop-func': 'warn',
      'no-multi-str': 'warn',
      'no-native-reassign': 'warn',
      'no-negated-in-lhs': 'warn',
      'no-new-func': 'warn',
      'no-new-wrappers': 'warn',
      'no-obj-calls': 'warn',
      'no-octal': 'warn',
      'no-octal-escape': 'warn',
      'no-regex-spaces': 'warn',
      'no-restricted-syntax': ['warn', 'WithStatement'],
      'no-script-url': 'warn',
      'no-self-assign': [
        'warn',
        {
          props: true,
        },
      ],
      'no-self-compare': 'warn',
      'no-sequences': 'warn',
      'no-shadow-restricted-names': 'warn',
      'no-sparse-arrays': 'warn',
      'no-template-curly-in-string': 'warn',
      'no-this-before-super': 'warn',
      'no-restricted-globals': [
        'error',
        'addEventListener',
        'blur',
        'close',
        'closed',
        'confirm',
        'defaultStatus',
        'defaultstatus',
        'event',
        'external',
        'find',
        'focus',
        'frameElement',
        'frames',
        'history',
        'innerHeight',
        'innerWidth',
        'length',
        'location',
        'locationbar',
        'menubar',
        'moveBy',
        'moveTo',
        'name',
        'onblur',
        'onerror',
        'onfocus',
        'onload',
        'onresize',
        'onunload',
        'open',
        'opener',
        'opera',
        'outerHeight',
        'outerWidth',
        'pageXOffset',
        'pageYOffset',
        'parent',
        'print',
        'removeEventListener',
        'resizeBy',
        'resizeTo',
        'screen',
        'screenLeft',
        'screenTop',
        'screenX',
        'screenY',
        'scroll',
        'scrollbars',
        'scrollBy',
        'scrollTo',
        'scrollX',
        'scrollY',
        'self',
        'status',
        'statusbar',
        'stop',
        'toolbar',
        'top',
        {
          name: 'atob',
          message: 'This API is deprecated. Use https://github.com/sindresorhus/uint8array-extras instead.',
        },
        {
          name: 'btoa',
          message: 'This API is deprecated. Use https://github.com/sindresorhus/uint8array-extras instead.',
        },
      ],
      'no-unreachable': 'warn',
      'no-unused-labels': 'warn',
      'no-unused-private-class-members': 'warn',
      'no-useless-computed-key': [
        'warn',
        {
          enforceForClassMembers: true,
        },
      ],
      'no-useless-concat': 'warn',
      'no-useless-escape': 'warn',
      'no-useless-rename': [
        'warn',
        {
          ignoreDestructuring: false,
          ignoreImport: false,
          ignoreExport: false,
        },
      ],
      'no-with': 'warn',
      'prefer-named-capture-group': 'error',
      'prefer-template': 'error',
      'require-atomic-updates': 'warn',
      'require-yield': 'warn',
      strict: ['warn', 'never'],
      'use-isnan': 'warn',
      'valid-typeof': [
        'warn',
        {
          requireStringLiterals: false,
        },
      ],
      'getter-return': 'warn',
      'sort-imports': ['warn', { ignoreDeclarationSort: true }],

      '@eslint-community/eslint-comments/require-description': 'warn',

      'promise/no-multiple-resolved': 'error',
      'promise/prefer-catch': 'error',

      'import-x/newline-after-import': 'warn',
      'import-x/no-amd': 'error',
      'import-x/no-anonymous-default-export': 'warn',
      'import-x/no-empty-named-blocks': 'error',
      'import-x/no-unresolved': 'off',
      'import-x/no-webpack-loader-syntax': 'error',
      'import-x/no-namespace': 'warn',
      // off because its in conflict with @typescript-eslint/no-import-type-side-effects
      'import-x/consistent-type-specifier-style': 'off',
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            {
              pattern: '{pages,locales,permissions,ui}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '{common,features,pages,locales,models,permissions,ui,types}/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      'unicorn/consistent-destructuring': 'error',
      'unicorn/template-indent': 'warn',
      'unicorn/require-post-message-target-origin': 'error',
      'unicorn/filename-case': 'off',
      'unicorn/no-null': 'off',
      'unicorn/switch-case-braces': ['error', 'avoid'],
      'unicorn/no-useless-undefined': 'off',
      'unicorn/prefer-import-meta-properties': 'error',
      'unicorn/prefer-global-this': 'off',
      'unicorn/prevent-abbreviations': [
        'error',
        {
          ignore: ['param', 'Params', 'err', 'props', 'i18n', 'ref', 'Ref'],
        },
      ],
      'unicorn/prefer-node-protocol': ['error'],

      'react/hook-use-state': ['error', { allowDestructuredState: true }],
      'react/self-closing-comp': [
        'error',
        {
          component: true,
          html: true,
        },
      ],
      'react/jsx-uses-react': 'off',
      'react/jsx-sort-props': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/forbid-foreign-prop-types': [
        'warn',
        {
          allowInPropTypes: true,
        },
      ],
      'react/jsx-no-comment-textnodes': 'warn',
      'react/jsx-no-duplicate-props': 'warn',
      'react/no-object-type-as-default-prop': 'warn',
      'react/jsx-no-target-blank': 'warn',
      'react/jsx-pascal-case': [
        'warn',
        {
          allowAllCaps: false,
          ignore: [],
        },
      ],
      'react/no-typos': 'error',
      'react/style-prop-object': 'error',
      'react/jsx-uses-vars': 'warn',
      'react/boolean-prop-naming': 'error',
      'react/button-has-type': 'error',
      'react/destructuring-assignment': ['error', 'always'],
      'react/no-array-index-key': 'error',
      'react/no-arrow-function-lifecycle': 'error',
      'react/no-danger': 'error',
      'react/no-children-prop': ['error', { allowFunctions: true }],
      'react/no-unused-class-component-methods': 'warn',
      'react/jsx-child-element-spacing': 'error',
      'react/jsx-fragments': ['warn', 'syntax'],
      'react/jsx-handler-names': 'error',
      'react/jsx-no-leaked-render': 'warn',
      'react/jsx-no-constructed-context-values': 'warn',
      'react/jsx-no-useless-fragment': ['warn', { allowExpressions: true }],
      // a lot of false positives
      'react/prop-types': 'off',
      // a lot of false positives and not very useful with react functional components
      'react/display-name': 'off',
      'react/void-dom-elements-no-children': 'error',
      'react/jsx-boolean-value': 'error',
      'react/function-component-definition': ['error', { namedComponents: 'arrow-function' }],
      'react/jsx-curly-brace-presence': 'warn',
      'react/jsx-props-no-spread-multi': 'error',

      'react-hooks/exhaustive-deps': [
        'error',
        {
          additionalHooks: 'useRecoilCallback|useRecoilTransaction_UNSTABLE|useRecoilTransaction',
        },
      ],

      'jsx-a11y-x/alt-text': 'warn',
      'jsx-a11y-x/anchor-is-valid': 'warn',
      'jsx-a11y-x/iframe-has-title': 'warn',
      'jsx-a11y-x/img-redundant-alt': 'warn',
      'jsx-a11y-x/no-access-key': 'warn',
      'jsx-a11y-x/no-aria-hidden-on-focusable': 'error',
      'jsx-a11y-x/no-redundant-roles': 'warn',
      'jsx-a11y-x/prefer-tag-over-role': 'error',
      'jsx-a11y-x/role-has-required-aria-props': 'warn',
      'jsx-a11y-x/role-supports-aria-props': 'warn',

      'prettier/prettier': ['error'],

      '@stylistic/jsx-quotes': 'off',
      '@stylistic/quotes': 'off',
      '@stylistic/arrow-parens': 'off',
      '@stylistic/comma-dangle': 'off',
      '@stylistic/comma-spacing': 'off',
      '@stylistic/comma-style': 'off',
      '@stylistic/computed-property-spacing': 'off',
      '@stylistic/dot-location': 'off',
      '@stylistic/multiline-ternary': 'off',
      '@stylistic/block-spacing': 'off',
      '@stylistic/function-paren-newline': 'off',
      '@stylistic/indent-binary-ops': 'off',
      '@stylistic/object-curly-newline': 'off',
      '@stylistic/operator-linebreak': 'off',
      '@stylistic/lines-between-class-members': 'off',
      '@stylistic/padding-line-between-statements': 'off',
      '@stylistic/no-mixed-operators': 'off',
      '@stylistic/curly-newline': 'off',
      '@stylistic/type-named-tuple-spacing': 'off',
      '@stylistic/type-generic-spacing': 'off',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@typescript-eslint/no-restricted-types': 'off',

      'import-x/default': 'off',
      '@typescript-eslint/consistent-type-exports': 'off',
      'prefer-arrow-callback': 'off',

      '@typescript-eslint/no-empty-object-type': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'error',
      'import-x/no-named-as-default': 'off',
      'import-x/no-named-as-default-member': 'off',
      // Rule is for checking if imports exists, for that we have typescript
      'import-x/named': 'off',

      'sonarjs/redundant-type-aliases': 'off',
      'sonarjs/todo-tag': 'off',
      'sonarjs/no-unused-vars': 'off',
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/function-return-type': 'off',
      // Error on routes that contains word password
      'sonarjs/no-hardcoded-passwords': 'off',
      'sonarjs/elseif-without-else': 'error',
      'sonarjs/deprecation': 'off',
      'sonarjs/no-nested-conditional': 'off',

      '@typescript-eslint/no-unsafe-type-assertion': ['error'],

      'arrow-body-style': ['error'],

      // Auto fix not working in this package and conflicts with `perfectionist`
      '@typescript-eslint/member-ordering': 'off',

      // turning this off because import is sorted by rule import-x/order
      'perfectionist/sort-imports': 'off',
      'perfectionist/sort-named-imports': 'off',
      'perfectionist/sort-objects': [
        'error',
        {
          type: 'unsorted',
          useConfigurationIf: {
            callingFunctionNamePattern:
              '^(useInfiniteQuery|useSuspenseInfiniteQuery|infiniteQueryOptions|createFileRoute)$',
          },
        },
      ],
      '@typescript-eslint/sort-type-constituents': 'off',

      'promise/spec-only': 'error',

      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        {
          allowDefaultCaseForExhaustiveSwitch: true,
        },
      ],
    },
  },
  {
    name: 'ui-restricted-imports',
    files: ['src/**/ui/**/*.[jt]s?(x)', 'App.tsx'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'error' },
            { name: 'domain' },
            { name: 'freelist' },
            { name: 'smalloc' },
            { name: 'punycode' },
            { name: 'sys' },
            { name: 'querystring' },
            { name: 'colors' },
          ],
          patterns: [{ group: ['features/*/*'], message: 'Direct feature imports are restricted' }],
        },
      ],
    },
  },
  {
    name: 'tsx-naming-convention',
    files: ['**/*.tsx'],
    rules: {
      ...getNamingConventionRule({ isTsx: true }),
    },
  },
];
