# Migration guide for AI agents: 0.25 (ESLint + Prettier) → 0.26 (oxlint + oxfmt)

This guide tells an AI agent how to move a project from `@touch4it/eslint-config-sandokan` 0.25.x to 0.26.0. Follow the steps in order and run every check. Stop and ask the user when a step says so.

## What changed

| | 0.25.x | 0.26.0 |
|---|---|---|
| Linter | ESLint 9, `eslint.config.mjs` | oxlint, `.oxlintrc.json` |
| Formatter | Prettier, `.prettierrc.yaml` | oxfmt, `oxfmt.config.ts` |
| React config | `@touch4it/eslint-config-sandokan/react` | `react/oxlintrc.json` + `@touch4it/eslint-config-sandokan/react/oxfmt` |
| Angular config | `@touch4it/eslint-config-sandokan/angular` | `angular/oxlintrc.json` + `@touch4it/eslint-config-sandokan/angular/oxfmt` + `@touch4it/eslint-config-sandokan/angular/eslint-templates` for `.html` |
| Prettier config | `@touch4it/eslint-config-sandokan/prettier` | removed, use the oxfmt config |
| TypeScript config | `@touch4it/eslint-config-sandokan/typescript` | same, plus `allowUnusedLabels: false` |
| Type-aware rules | typescript-eslint | `tsrs`, React only |

The exports `./react`, `./angular` and `./prettier` no longer exist. Importing them fails.

## 1. Inspect the project

1. Read `package.json` and find the sandokan version. Continue only if it is 0.25.x or older.
2. Find which config the project uses: look for `@touch4it/eslint-config-sandokan/react` or `/angular` in `eslint.config.*`.
3. Read the whole `eslint.config.*`. List everything it adds on top of sandokan: extra plugins, rules, `files` overrides and `ignores`.
4. Find every place that runs or configures ESLint or Prettier: `package.json` scripts, `lint-staged`, husky hooks, CI files (`.gitlab-ci.yml`, `.github/workflows/*`), `.vscode/settings.json`, `.vscode/extensions.json`, `.idea/`, and other tools such as knip (`knip.json`) or `vite-plugin-checker` (`vite.config.*`).
5. Find leftovers in the package manager config: `overrides` and `resolutions` in `package.json`, `pnpm.overrides`, and `overrides` or `catalog` entries in `pnpm-workspace.yaml` that name ESLint, Prettier or their plugins.
6. If the project is a monorepo, follow [Monorepos](#monorepos) as well.

Stop and ask the user if `eslint.config.*` adds plugins or rules beyond `ignores` and simple rule overrides. Show them the list from step 3.

## 2. Update dependencies

Use the project's package manager. The commands below use npm.

React:

```sh
npm install @touch4it/eslint-config-sandokan@0.26.0 oxlint oxfmt --save-dev
npm install tsrs@0.25.0-ts7.1.0-beta --save-dev --save-exact
npm uninstall eslint prettier prettier-plugin-curly prettier-plugin-packagejson
```

Angular:

```sh
npm install @touch4it/eslint-config-sandokan@0.26.0 eslint oxlint oxfmt --save-dev
npm uninstall prettier prettier-plugin-curly prettier-plugin-packagejson
```

- Install `tsrs` with exactly this version. A different version makes npm fail with `ERESOLVE`. Do not install `oxlint-tsgolint`.
- Angular keeps `eslint`, because oxlint cannot lint Angular templates.
- Uninstall only packages the project lists in `package.json`. Keep `eslint` in a React project only if the user decided in step 1 to keep extra ESLint rules.
- Remove the leftovers from step 1.5. A stale override pins a package that no longer exists, or pulls it back in.
- `prettier-plugin-packagejson` sorted the keys in `package.json`. If the project relied on it, ask the user whether to add `sort-package-json` instead.
- The installer may run the `prepare` script (husky). It writes `core.hooksPath` to `.git/config`, which `git diff` does not show. Check `git config core.hooksPath` after the install.
- oxlint, oxfmt and tsrs ship a native binary per platform as optional dependencies. Check that the lockfile contains the Linux binaries CI needs, not only the one for the local machine. If they are missing, CI fails with `Cannot find native binding`. Regenerate the lockfile from scratch if needed.

## 3. Replace config files

### React

Create `.oxlintrc.json`:

```json
{
  "extends": ["./node_modules/@touch4it/eslint-config-sandokan/react/oxlintrc.json"],
  "options": {
    "reportUnusedDisableDirectives": "error"
  }
}
```

Create `oxfmt.config.ts`:

```ts
export { default } from '@touch4it/eslint-config-sandokan/react/oxfmt';
```

Delete `eslint.config.*` and `.prettierrc*`.

### Angular

Create `.oxlintrc.json`:

```json
{
  "extends": ["./node_modules/@touch4it/eslint-config-sandokan/angular/oxlintrc.json"]
}
```

Create `oxfmt.config.ts`:

```ts
export { default } from '@touch4it/eslint-config-sandokan/angular/oxfmt';
```

Replace the content of `eslint.config.mjs`. It now lints only `.html` templates:

```js
import angularTemplates from '@touch4it/eslint-config-sandokan/angular/eslint-templates';
import { defineConfig } from 'eslint/config';

export default defineConfig([angularTemplates]);
```

Delete `.prettierrc*`.

### Both

- Move `ignores` from the old `eslint.config.*` to `ignorePatterns` in `.oxlintrc.json`. oxlint already skips files from `.gitignore`.
- Keep `.prettierignore`. oxfmt reads `.gitignore` and `.prettierignore` by default.
- Move simple rule overrides to `rules` in `.oxlintrc.json`. Rename the plugin prefix with the table below. Check that the rule exists in the [oxlint rule list](https://oxc.rs/docs/guide/usage/linter/rules.html). If it does not exist, ask the user.
- Move `files` overrides to `overrides` in `.oxlintrc.json`. oxlint overrides have no `ignores`. Narrow the `files` globs instead, or ask the user.
- oxlint has no `no-restricted-syntax`. Check the rule list for a native rule that covers each selector the project used. Show the user the rest and ask what to do.
- Keep the `"extends": "@touch4it/eslint-config-sandokan/typescript"` line in `tsconfig.json`.

| ESLint prefix | oxlint prefix |
|---|---|
| `@typescript-eslint/` | `typescript/` |
| `react-hooks/` | `react/` |
| `react/` | `react/`, except `react/jsx-no-leaked-render` → `sandokan/jsx-no-leaked-render` |
| `@typescript-eslint/naming-convention` | `sandokan/naming-convention` |
| `import-x/`, `import/` | `import/` |
| `jest/`, `vitest/` | `jest/` |
| `unicorn/`, `jsx-a11y/`, `promise/`, `jsdoc/`, `perfectionist/`, `regexp/`, `testing-library/`, `@tanstack/query/`, `@angular-eslint/` | same |
| `@stylistic/`, `prettier/` | none, oxfmt formats the code |
| `sonarjs/`, `@eslint-community/eslint-comments/` | mostly none, see [Lost rules](#lost-rules) |

### Monorepos

- Create `.oxlintrc.json` and `oxfmt.config.ts` in every package that had `eslint.config.*`. The `extends` path is relative to the `.oxlintrc.json` file. Point it to the `node_modules` folder where the package manager installs sandokan for that package.
- With pnpm, check `pnpm-workspace.yaml`. If it uses `catalog:`, change the versions there, not in each `package.json`.
- Run the scripts from step 4 in every package, or from the root with the workspace command (`pnpm -r`, `npm --workspaces`).

## 4. Update scripts and tools

React `package.json` scripts:

```json
{
  "lint": "oxlint --type-aware",
  "format": "oxfmt",
  "format:check": "oxfmt --check"
}
```

Angular `package.json` scripts:

```json
{
  "lint": "oxlint && eslint 'src/**/*.html'",
  "format": "oxfmt",
  "format:check": "oxfmt --check"
}
```

Keep the project's script names if they differ. Change only the commands.

Replace the commands everywhere else you found in step 1:

- `eslint --fix <files>` → `oxlint --fix <files>`. In Angular, keep `eslint --fix` for `.html` files.
- `prettier --write <files>` → `oxfmt <files>`
- `prettier --check` → `oxfmt --check`

### Editors: format on save

Ask the user which editors the team uses: VS Code (or Cursor), JetBrains (WebStorm, IntelliJ IDEA) or Neovim. For each one, find out whether it formats or fixes on save with Prettier or ESLint, and switch it to oxfmt and oxlint. All editor integrations run the `oxfmt` and `oxlint` installed in the project.

**VS Code.** Look in `.vscode/settings.json`, including per-language blocks like `"[typescript]"`, for `esbenp.prettier-vscode`, `dbaeumer.vscode-eslint` and `source.fixAll.eslint`. Replace them:

```json
{
  "editor.defaultFormatter": "oxc.oxc-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.oxc": "always"
  }
}
```

- In `.vscode/extensions.json`, replace `esbenp.prettier-vscode` and `dbaeumer.vscode-eslint` with `oxc.oxc-vscode`.
- Angular keeps `dbaeumer.vscode-eslint` and `source.fixAll.eslint` for `.html` templates. Set `oxc.oxc-vscode` as the formatter for `.html` too, because oxfmt formats Angular templates.
- If there is no `.vscode/settings.json`, the settings are in the user's own VS Code settings. Tell the user what to change.

**JetBrains.** Look for `.idea/prettier.xml` and `.idea/jsLinters/eslint.xml`. They are often not committed. Ask the user to:

1. Install the **Oxc** plugin from JetBrains Marketplace.
2. Turn on format on save and fix on save in the Oxc plugin settings.
3. Turn off **Run on save** in Settings → Languages & Frameworks → JavaScript → Prettier.
4. React: turn off ESLint in Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint. Angular: keep ESLint, but only for `.html` files.

**Neovim.** The config is in the user's own dotfiles (usually `~/.config/nvim`), not in the project. Ask the user before you read or change it. Look for `prettier`, `prettierd`, `eslint` and `eslint_d` in conform.nvim `formatters_by_ft`, none-ls or null-ls sources, nvim-lspconfig servers and `BufWritePre` autocommands. Then:

- conform.nvim: set `oxfmt` for `javascript`, `javascriptreact`, `typescript`, `typescriptreact` and `json`, and keep the existing format-on-save setup.
- nvim-lspconfig: enable the `oxfmt` server with `vim.lsp.enable('oxfmt')`.
- Remove Prettier from formatting. React: remove ESLint too. Angular: keep ESLint only for `.html`.

## 5. Reformat the code

1. Run `npm run format`.
2. Commit the result as a separate commit with only formatting changes. oxfmt sorts imports differently from the old `import-x/order` rule, so many files change.
3. Add the hash of that commit to `.git-blame-ignore-revs` and commit it, so `git blame` skips the reformat.

## 6. Fix lint results

1. Run `npm run lint`.
2. Run `npx oxlint --fix` (React: `npx oxlint --type-aware --fix`) for autofixable problems. Run it twice, because some fixes need a second pass. Commit the fixes as a separate commit. Read the diff before you commit: some fixes change behavior, for example `sandokan/jsx-no-leaked-render` turns `a && b` into `a ? b : null`. Revert a fix that changes what the code does and ask the user.
3. Delete `eslint-disable` comments that `reportUnusedDisableDirectives` reports as unused. Many old rules (most of `sonarjs`, `eslint-comments`) no longer exist, so their disable comments are unused. Search for directives in every form: `// eslint-disable-next-line`, `/* eslint-disable */` at the top of a file, and `{/* eslint-disable-next-line */}` inside JSX.
4. Keep the other existing `eslint-disable` comments. oxlint reads them, including old names like `@typescript-eslint/...`. This does not work for rules that moved to the `sandokan` JS plugin. Rename `@typescript-eslint/naming-convention` to `sandokan/naming-convention` and `react/jsx-no-leaked-render` to `sandokan/jsx-no-leaked-render` in disable comments before step 3.
5. Some rules report on a different line than ESLint did. `jsx-a11y/no-redundant-roles` reports on the line of the attribute (`role="list"`), not on the line of the element. When the element spans several lines, an `eslint-disable-next-line` above the element no longer covers the error, and `--fix` deletes the intentional role. Move the comment to the line above the attribute. Before you delete a directive as unused, check whether the same rule reports an error a few lines below. If it does, move the directive there instead.
6. Fix the remaining errors in code. Do not turn rules off and do not add new disable comments without asking the user.

If more than about 50 errors remain, stop and show the user the count per rule. Ask how to continue.

Do not fix errors from the React Compiler rules (`react/purity`, `react/refs`, `react/immutability`, `react/set-state-in-render`, `react/set-state-in-effect`, `react/static-components` and others with a React Compiler note) on your own. oxlint can report more of them than ESLint did, for example `new Date()` during render. A fix often needs a different component design. Show the user the count per rule and a few examples, and ask how to continue.

## 7. Verify

Run all of these and fix what fails:

- `npm run lint` ends without errors.
- `npm run format:check` ends without errors.
- The TypeScript build (`tsc --noEmit` or the project's script) passes. The new `allowUnusedLabels: false` can report unused labels.
- The project's tests pass.
- No file imports `@touch4it/eslint-config-sandokan/react`, `/angular` or `/prettier`.
- No editor config in the project refers to Prettier. Ask the user to save a file with wrong formatting and confirm that oxfmt fixed it.
- `package.json` contains no `prettier*` packages. In React, it contains no `eslint`, unless the user chose to keep it.
- No override, catalog entry or tool config from steps 1.4 and 1.5 names ESLint, Prettier or their plugins.
- The project's other checks pass, for example knip.

## Known differences

- **Turned off on purpose:** `perfectionist/sort-arrays` and `jest/no-untyped-mock-factory`. Their `--fix` changes how the code behaves: the first reorders `as const` arrays such as React Query keys, the second writes `vi.mock<typeof import(...)>`, which fails `tsc` with vitest. Drop project overrides of these rules. Do not turn them back on.

- **`no-restricted-imports`:** oxlint reads patterns as globs, ESLint read them as gitignore patterns. Write `features/*/**` instead of `features/*/*`.
- **Messages:** for a `no-restricted-imports` pattern, oxlint prints only a general message, not the custom one.
- **`naming-convention`:** it does not check boolean prefixes, because oxlint does not pass type information to JS plugins.
- **Disable comments for `no-restricted-syntax`:** the rule does not exist, so these comments are reported as unused.

### Lost rules

These rules from 0.25 have no replacement. If the project turned one of them on or relied on it, tell the user. Do not add a JS plugin for it without asking.

- `sonarjs/*`: almost all, including `no-identical-functions`, `no-duplicated-branches`, `no-nested-template-literals`, `no-small-switch`, `no-commented-code` and the security hotspots. About 25 have a native replacement, such as `no-useless-assignment`, `no-self-compare`, `complexity`, `no-dupe-else-if` and `oxc/const-comparisons`.
- `@eslint-community/eslint-comments/*`. `unicorn/no-abusive-eslint-disable` replaces `no-unlimited-disable`.
- `require-atomic-updates`, `no-undef-init`, `@stylistic/spaced-comment`.
- `react/destructuring-assignment`, `react/boolean-prop-naming`, `react/no-typos`, `react/jsx-child-element-spacing`.
- Angular: 14 `jsdoc` rules for alignment and types, and `@typescript-eslint/member-ordering`.
