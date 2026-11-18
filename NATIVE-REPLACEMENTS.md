# Prechod z ESLint na oxlint

## Zhrnutie

- **Rýchlosť:** lint React projektu klesol z 81 s na ~16 s, Angular projektu z 55 s na 3,3 s.
- **Pokrytie:** React config pokrýva **83 %** pravidiel pôvodného ESLint configu, Angular config **89 %**.
- **Čo ostalo:** všetky pravidlá, ktoré v praxi chytajú chyby: type-aware `typescript`, React Compiler, `jsx-a11y`, `@tanstack/query`.
- **Čo chýba:** hlavne `sonarjs` code smells.

Natívne pravidlá bežia v Ruste. JS plugin potrebuje Node.js a kópiu AST pre každý súbor, preto sme JS pluginy nahradili všade, kde to šlo s malou stratou.

## Rýchlosť

React, 4 113 súborov, type-aware:

- ESLint: 81 s
- oxlint so všetkými JS pluginmi: 30,7 s
- oxlint teraz: **~16 s** (14,8 s bez `regexp`, plugin pridá ~1,5 s)

React, 2 718 súborov, type-aware:

- oxlint teraz: **6,5 s** (merané bez `perfectionist`)

Angular, 1 869 `.ts` súborov:

- ESLint: 55 s
- oxlint so všetkými JS pluginmi: 7 s
- oxlint teraz: **1,5 s** + 1,8 s ESLint na šablóny

React config má **99** JS pravidiel, pôvodne ich bolo 364. Najdrahšie sú `perfectionist` (~3,7 s), `naming-convention` (~3 s) a `regexp` (~1,5 s).

## Pokrytie

### React: 83 %

Pôvodný config mal zapnutých **830** pravidiel:

- 424: rovnaké pravidlo natívne v oxlinte
- 98: rovnaké pravidlo cez JS plugin
- 41: natívna náhrada pod iným menom
- 31: pokryté TypeScript compilerom
- 16: duplicita s iným natívnym pravidlom
- 17: nemajú čo hlásiť, lebo iné pravidlo zakazuje celý konštrukt
- 2: vypnuté kvôli konfliktu (`no-eq-null` s `eqeqeq: smart`, `typescript/non-nullable-type-assertion-style` s `typescript/no-non-null-assertion`)
- 1: náhrada cez JS plugin pod iným menom
- 2: vypnuté, lebo `--fix` mení správanie kódu (`perfectionist/sort-arrays` preusporiada `as const` polia, napríklad React Query keys; `jest/no-untyped-mock-factory` píše `vi.mock<typeof import(...)>`, čo s vitest neprejde cez `tsc`)
- 2: nahradené formatterom
- 30: nerelevantné
- 39: typové `sonarjs` pravidlá, ktoré v oxlinte nefungujú
- **127: stratené bez náhrady**

Pokrytie = 630 pokrytých z 761 relevantných (830 − 30 nerelevantných − 39 typových) = **83 %**.

Nerelevantné sú AWS pravidlá (17), deprecated a strict mode pravidlá, `no-restricted-syntax` pre `with`, pravidlá pre class komponenty a nastavenia React Compilera.

Typové `sonarjs` pravidlá nefungujú, lebo oxlint neposiela JS pluginom informácie o typoch.

### Angular: 89 %

Pôvodný config mal zapnutých **140** pravidiel:

- 87: rovnaké pravidlo natívne v oxlinte
- 5: pokryté TypeScript compilerom
- 13: rovnaké pravidlo cez JS plugin (`@angular-eslint`)
- 15: šablóny cez ESLint (`angular/eslint-templates.mjs`)
- 2: natívna náhrada pod iným menom
- 2: nahradené formatterom
- 1: nerelevantné (`no-octal`)
- **15: stratené bez náhrady**

Pokrytie = 124 zo 139 = **89 %**.

## Čo sme nahradili

Bez straty:

- `prettier` + `prettier-plugin-curly` → oxfmt + pravidlo `curly`. oxfmt formátuje rovnako ako Prettier, vrátane Angular šablón.
- `react/jsx-sort-props` → `perfectionist/sort-jsx-props`
- `react/no-deprecated` → `typescript/no-deprecated`
- `jest/unbound-method` → `typescript/unbound-method`
- `unicorn/no-named-default` → `import/no-named-default`
- Angular `unused-imports` → `no-unused-vars` s rovnakými options a `fix.imports: safe-fix`. Nepoužité importy sa pri `--fix` mažú automaticky.
- `regexp` (60 pravidiel): 56 beží cez JS plugin `eslint-plugin-regexp`. Zvyšné 4 (`no-invalid-regexp`, `no-useless-backreference`, `no-empty-character-class`, `no-useless-escape`) nahrádzajú natívne pravidlá s rovnakým menom.
- `dot-notation` → `typescript/dot-notation`
- `no-native-reassign` → `no-global-assign`
- `no-negated-in-lhs`, `no-unsafe-negation` → TypeScript compiler
- `unicorn/no-for-loop` → `typescript/prefer-for-of`
- `eslint-comments/no-unlimited-disable` → `unicorn/no-abusive-eslint-disable`
- `react-you-might-not-need-an-effect/no-derived-state`, `no-chain-state-updates`, `no-adjust-state-on-prop-change`, `no-reset-all-state-on-prop-change`, `no-initialize-state` → `react/set-state-in-effect`
- Pravidlá, ktoré hlási TypeScript compiler (napríklad `no-dupe-keys`, `no-unreachable`, `react/jsx-no-undef`, `react/no-unknown-property`), sú vypnuté rovnako ako v `typescript-eslint/eslint-recommended`.

So stratou:

- `import-x/order` → oxfmt `sortImports`. Poradie v rámci skupín je mierne iné, prechod jednorazovo preformátuje importy v časti súborov.
- `sonarjs` (194 pravidiel) → ~25 natívnych pravidiel, napríklad `no-useless-assignment`, `no-self-compare`, `complexity`, `no-dupe-else-if`, `no-fallthrough`, `no-useless-catch`, `typescript/no-array-delete`, `oxc/double-comparisons`, `oxc/const-comparisons`. Zvyšok je v časti [Čo sme stratili](#čo-sme-stratili).

## Čo sme stratili

### React: `sonarjs` (115)

- **Duplicitný kód:** `no-identical-functions`, `no-duplicated-branches`, `no-all-duplicated-branches`, `no-element-overwrite`, `no-redundant-assignments`. Toto je najväčšia reálna strata.
- **Code smells:** napríklad `no-unused-collection`, `no-use-of-empty-return-value`, `no-invariant-returns`, `no-nested-assignment`, `no-nested-template-literals`, `prefer-single-boolean-return`, `no-small-switch`, `no-commented-code`.
- **Security hotspoty:** napríklad `cookie-no-httponly`, `cors`, `csrf`, `hashing`, `no-hardcoded-secrets`, `pseudo-random`. Väčšina sa týka serverového kódu.
- **Testy (12):** napríklad `assertions-in-tests`, `no-exclusive-tests`, `no-skipped-tests`.

### React: vyradené JS pluginy (6)

- `require-atomic-updates` z ESLint core: má veľa false positives, ESLint ho preto vyradil z `recommended`.
- `@eslint-community/eslint-comments` (`disable-enable-pair`, `no-aggregating-enable`, `no-duplicate-disable`, `no-unused-enable`, `require-description`): kontrolujú iba `eslint-disable` komentáre, nie `oxlint-disable`. Neobmedzený disable hlási `unicorn/no-abusive-eslint-disable`.

### React: ostatné (6)

- `react/destructuring-assignment`
- `react/boolean-prop-naming`
- `react/no-typos`
- `react/jsx-child-element-spacing`
- `@stylistic/spaced-comment` (medzera za `//`)
- `no-undef-init`

### Angular (15)

- **`jsdoc` (14):** kontrola zarovnania, typov a hviezdičiek v JSDoc. Natívny `jsdoc` plugin pokrýva 13 pravidiel.
- **`member-ordering` (1):** poradie členov triedy.

## Rozdiely v správaní

- **`no-restricted-imports` patterny:** ESLint ich číta ako gitignore patterny, oxlint ako glob. Preto config používa `features/*/**` namiesto `features/*/*`.
- **Vlastné správy:** pri `no-restricted-imports` oxlint nevypíše vlastnú správu, iba všeobecné „import is restricted from being used by a pattern“.
- **Disable komentáre:** oxlint rešpektuje existujúce `// eslint-disable-next-line @typescript-eslint/...` komentáre.
