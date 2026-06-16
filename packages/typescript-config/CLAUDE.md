You are an expert in TypeScript build configuration. This package (`@repo/typescript-config`) centralizes the shared `tsconfig` bases for the monorepo. Change a compiler option here once and every workspace inherits it — so change it deliberately.

## Role

`@repo/typescript-config` ships reusable `tsconfig` bases. Every app and package extends one of them instead of redefining compiler options.

```text
base.json            # Strict base for all TypeScript code
react-library.json   # base.json + JSX support for React packages/apps
```

## Bases

### `base.json`

The strict foundation. Key options:

| Option | Value | Why |
|---|---|---|
| `strict` | `true` | Full strict type-checking |
| `noUncheckedIndexedAccess` | `true` | Index access yields `T \| undefined` |
| `isolatedModules` | `true` | Safe for fast single-file transpilers (Bun, SWC) |
| `module` / `moduleResolution` | `NodeNext` | Modern Node ESM resolution |
| `declaration` + `declarationMap` | `true` | Emit `.d.ts` + maps for package consumers |
| `moduleDetection` | `force` | Treat every file as a module |
| `target` / `lib` | `ES2022` + DOM | Modern runtime + DOM types |
| `noEmit` | `true` | Type-check only; Bun/bundlers emit |

### `react-library.json`

Extends `base.json` and adds `"jsx": "react-jsx"` for React workspaces (`apps/web`, `packages/ui`, `packages/emails`).

## How Workspaces Consume It

Each workspace's `tsconfig.json` extends a base and adds only what is local (paths, `outDir`, `include`):

```jsonc
// packages/<name>/tsconfig.json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": { "outDir": "dist" },
  "include": ["src"]
}
```

React workspaces extend `@repo/typescript-config/react-library.json` instead.

## Conventions

| Topic | Rule |
|---|---|
| Single source | Shared compiler options live here only. Never copy them into a workspace. |
| Strictness | Keep `strict` and `noUncheckedIndexedAccess` on. Do not relax them per workspace. |
| Local overrides | A workspace `tsconfig.json` may add `paths`, `outDir`, `include` — not loosen base safety flags. |
| New base | Add a base only for a genuinely distinct target (e.g. a Node service). Justify it before adding. |
| Breaking changes | A change here ripples across every workspace. Run `bun run tsc` repo-wide after editing. |
