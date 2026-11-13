# eslint-config-sandokan

Opinionated [oxlint](https://oxc.rs/docs/guide/usage/linter.html) and [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) configurations for TypeScript projects:

- **React**: React, hooks and React Compiler rules, TypeScript with type-aware rules, React Query, Jest + Testing Library
- **Angular**: Angular, TypeScript, JSDoc, plus an ESLint config for `.html` templates

It also contains a shared `tsconfig.json`.

![Sandokan](sandokan.jpg)

The configs prefer native oxlint rules. A few rules without a native equivalent run through [oxlint JS plugins](https://oxc.rs/docs/guide/usage/linter/js-plugins.html): TanStack Query, Testing Library, perfectionist, you-might-not-need-an-effect, eslint-comments, @angular-eslint, and some rules from eslint, unicorn, react and typescript-eslint. [NATIVE-REPLACEMENTS.md](NATIVE-REPLACEMENTS.md) lists the plugins covered by native rules and what those rules do not check.

Both oxlint configs enable `oxfmt/oxfmt` from [eslint-plugin-oxfmt](https://github.com/ntnyq/eslint-plugin-oxfmt), so oxlint and the IDE report unformatted code as errors and `oxlint --fix` formats it. The rule uses the project's `oxfmt.config.ts`, the same config the `oxfmt` command uses.

## React

```sh
npm install @touch4it/eslint-config-sandokan eslint oxlint oxlint-tsgolint oxfmt --save-dev
```

`.oxlintrc.json`:

```json
{
  "extends": ["./node_modules/@touch4it/eslint-config-sandokan/react/oxlintrc.json"],
  "options": {
    "reportUnusedDisableDirectives": "error"
  }
}
```

`package.json` scripts:

```json
{
  "lint": "oxlint --type-aware",
  "format": "oxfmt",
  "format:check": "oxfmt --check"
}
```

`oxfmt.config.ts`:

```ts
export { default } from '@touch4it/eslint-config-sandokan/react/oxfmt';
```

The React config applies stricter Jest + Testing Library rules to `*.spec.*` and `*.test.*` files, and restricts imports from `features/*/**` inside `src/**/ui/**` and `App.tsx`.

## Angular

```sh
npm install @touch4it/eslint-config-sandokan eslint oxlint oxfmt --save-dev
```

`.oxlintrc.json`:

```json
{
  "extends": ["./node_modules/@touch4it/eslint-config-sandokan/angular/oxlintrc.json"]
}
```

oxlint cannot lint Angular templates, so `.html` files keep a small ESLint config. `eslint.config.mjs`:

```js
import angularTemplates from '@touch4it/eslint-config-sandokan/angular/eslint-templates';
import { defineConfig } from 'eslint/config';

export default defineConfig([angularTemplates]);
```

`package.json` scripts:

```json
{
  "lint": "oxlint && eslint 'src/**/*.html'",
  "format": "oxfmt",
  "format:check": "oxfmt --check"
}
```

`oxfmt.config.ts`:

```ts
export { default } from '@touch4it/eslint-config-sandokan/angular/oxfmt';
```

`angular/oxfmt.config.mjs` formats `.html` files (except `index.html`) as Angular templates.

## TypeScript

To use the shared TypeScript config, set the following in `tsconfig.json`:

```json
{
  "extends": "@touch4it/eslint-config-sandokan/typescript"
}
```

## Limitations

- `naming-convention` does not check boolean prefixes, because oxlint does not pass type information to JS plugins.

## TODO

- unicorn/filename-case
