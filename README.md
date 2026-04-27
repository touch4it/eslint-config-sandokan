# eslint-config-sandokan

Opinionated ESLint configurations for projects using TypeScript. Two configs are available:

- **React** — React with hooks, TypeScript, React Query, Jest + Testing Library
- **Angular** — Angular, TypeScript, JSDoc, Jest

It also contains shared configuration for `Prettier` and `TypeScript`.

![Sandokan](sandokan.jpg)

## Installation

```sh
npm install @touch4it/eslint-config-sandokan --save-dev
```

## Usage

### React

```js
import reactConfig from '@touch4it/eslint-config-sandokan/react';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  reactConfig,
  // ...rest of the config
]);
```

The React config applies stricter Jest + Testing Library rules to all files matching `**/?(*.)+(spec|test).[jt]s?(x)`, and restricts imports from `features/*/*` inside `src/**/ui/**` and `App.tsx`.

### Angular

```js
import angularConfig from '@touch4it/eslint-config-sandokan/angular';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  angularConfig,
  // ...rest of the config
]);
```

The Angular config covers `.ts` source files and `.html` templates (with accessibility rules).

## Prettier

To use the shared Prettier config, set the following in `.prettierrc.yaml`:

`'@touch4it/eslint-config-sandokan/prettier'`

## TypeScript

To use the shared TypeScript config, set the following in `tsconfig.json`:

```json
{
  "extends": "@touch4it/eslint-config-sandokan/typescript"
}
```

## TODO

- unicorn/filename-case
