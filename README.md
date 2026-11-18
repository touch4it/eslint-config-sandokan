# eslint-config-sandokan

Opinionated [oxlint](https://oxc.rs/docs/guide/usage/linter.html) and [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) configurations for TypeScript projects:

- **React**: React, hooks and React Compiler rules, TypeScript with type-aware rules, React Query, Jest + Testing Library
- **Angular**: Angular, TypeScript, JSDoc, plus an ESLint config for `.html` templates

It also contains a shared `tsconfig.json`.

![Sandokan](sandokan.jpg)

Upgrading from 0.25 (ESLint + Prettier)? Follow [MIGRATION.md](MIGRATION.md). It is written as step-by-step instructions for AI agents.

The configs prefer native oxlint rules. A few rules without a native equivalent run through [oxlint JS plugins](https://oxc.rs/docs/guide/usage/linter/js-plugins.html): TanStack Query, Testing Library, perfectionist, regexp, you-might-not-need-an-effect, @angular-eslint, some rules from eslint, unicorn and typescript-eslint, and our own `sandokan` plugin (`react/plugins/sandokan.mjs`) with `naming-convention` and `jsx-no-leaked-render`, a port of the `eslint-plugin-react` rule that does not support ESLint 10. [NATIVE-REPLACEMENTS.md](NATIVE-REPLACEMENTS.md) lists the plugins covered by native rules and what those rules do not check.

Both oxlint configs enable `oxfmt/oxfmt` from [eslint-plugin-oxfmt](https://github.com/ntnyq/eslint-plugin-oxfmt), so oxlint and the IDE report unformatted code as errors and `oxlint --fix` formats it. The rule uses the project's `oxfmt.config.ts`, the same config the `oxfmt` command uses.

## React

> [!WARNING]
> **Type-aware rules run on [tsrs](https://github.com/oxc-project/tsrs), not on `oxlint-tsgolint`.**
>
> - Install `tsrs` yourself in exactly version `0.25.0-ts7.1.0-beta`, as shown below. It is an optional peer dependency, so npm and pnpm do not install it automatically. Angular projects do not need it.
> - Always install the exact version. tsrs publishes only beta versions, and a different version makes npm fail with `ERESOLVE`. Plain `npm install tsrs` installs the latest beta, which may not match. A new tsrs version reaches projects only through a new release of this package.
> - oxlint uses tsrs automatically. You do not need `oxlint-tsgolint`.
> - tsrs is a beta built on TypeScript 7.1 beta. Your project can stay on TypeScript 6, because tsrs has its own compiler.
> - On a 4 117-file React project, tsrs reported the same diagnostics as `oxlint-tsgolint` 7.0.2007 and used about 40 % less memory.

```sh
npm install @touch4it/eslint-config-sandokan oxlint oxfmt --save-dev
npm install tsrs@0.25.0-ts7.1.0-beta --save-dev --save-exact
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

## Tests

```sh
npm test
```

## Limitations

- `naming-convention` does not check boolean prefixes, because oxlint does not pass type information to JS plugins.

## TODO

- unicorn/filename-case
