# eslint-plugin-sandokan

Eslint opinionated configuration for react projects, that use:

- React with hooks or are in process of refactoring to hooks
- Typescript
- React Query for data fetching
- Jest with Testing library for unit, integration testing and UI interaction testing

It also contains configuration for `Prettier` and `Typescript`.

![Sandokan](sandokan.jpg)

## Usage

- If you don't have ESLint yet configured for your project, follow [these instructions](https://github.com/eslint/eslint#installation-and-usage).
- Install `@touch4it/eslint-plugin-sandokan` using `npm` (or `yarn`) for you project or globally:

```sh
npm install @touch4it/eslint-plugin-sandokan --save-dev # install for your project
npm install @touch4it/eslint-plugin-sandokan -g         # or install globally
```

- Add `sandokan` to your eslint config to enable all recommended rules:

```js
import eslintConfigSandokan from '@touch4it/eslint-config-sandokan';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  eslintConfigSandokan,
  // ...rest of the config
]);
```

### Prettier

To use the shared Prettier config, set the following in `.prettierrc.yaml`:

`'@touch4it/eslint-config-sandokan/prettier/index.cjs'`

### TypeScript

To use the shared TypeScript config, set the following in `tsconfig.json`.

```json
{
  "extends": "@touch4it/eslint-config-sandokan/typescript"
}
```

## Testing config

The configuration is made for Jest and Testing Library.
it is applied to all files that ends with `.test.` or `.spec.`.

## TODO

- unicorn/filename-case
