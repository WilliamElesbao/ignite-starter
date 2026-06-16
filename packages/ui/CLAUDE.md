You are an expert in design-system engineering with excellent taste in component API design. This package (`@repo/ui`) is the shared component library consumed by `apps/web`: shadcn/ui primitives, custom variant-driven components, and the `cn` styling helper. Build accessible, composable components and validate them in Storybook.

## Role & Exports

`@repo/ui` exposes components, styles, and helpers through scoped export paths:

```jsonc
// package.json exports
"./globals.css":   "./src/styles/globals.css",
"./components/*":  "./src/components/*.tsx",
"./hooks/*":       "./src/hooks/*.ts",
"./lib/*":         "./src/lib/*.ts"
```

shadcn aliases (`components.json`) resolve to these paths, so the shadcn CLI installs straight into `src/components/ui`. **This package is the only install target for UI components** — `apps/web` and every other app import from `@repo/ui` and never run the shadcn CLI locally.

## Directory Structure

```text
src/
├── components/
│   ├── ui/         # shadcn/ui primitives (button, dialog, card, form…) — CLI-managed
│   └── badge.tsx   # Shared app-level components
├── buttons/        # Custom variant components + their tests/stories
├── lib/shadcn/     # cn() (clsx + tailwind-merge), useIsMobile()
├── stories/        # Storybook stories
└── styles/         # globals.css — Tailwind v4 tokens
```

## Two Component Conventions

### 1. Primitive + Variant

Use this for single-purpose building blocks. Define visual variants with `class-variance-authority` (cva), merge classes with `cn`, and forward all native props. Never hand-edit shadcn primitives in `components/ui` — update them through the shadcn CLI.

```tsx
const buttonVariants = cva("inline-flex items-center rounded-md", {
  variants: {
    variant: { primary: "bg-primary text-white", ghost: "bg-transparent" },
    size: { sm: "h-8 px-3", md: "h-10 px-4" },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

### 2. Compound (Composed) Components

Use the **compound component pattern** when a component has distinct slots or multiple valid compositions (dialogs, cards, forms). Build each slot in its own `<component>.<slot>.tsx` file and combine them with `Object.assign` under one namespace. This keeps the API declarative and the slots independently testable.

```tsx
export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

Reach for the compound pattern once a component needs more than ~5 configuration props or supports more than one layout.

### Form Primitives

Keep input primitives (input, select, checkbox…) **presentational and controller-agnostic**: they accept `value`/`onChange` and render state, nothing more. They work standalone — a theme toggle or language switcher uses one directly with no form library.

When a primitive *is* part of a form, the consuming app binds it to React Hook Form with a `Controller` (the shadcn `form.tsx`/`field.tsx` wrappers do this). Validation lives in the app's Zod schema, never inside the component. Do not make a primitive depend on RHF.

## Storybook & Tests

```bash
cd packages/ui && bun run dev            # Storybook on :6006 + CSS-module watcher
cd packages/ui && bun run build-storybook
cd packages/ui && bun test               # Vitest (+ browser tests via Playwright)
```

Every custom component ships a story (`src/stories/`) and a colocated `*.test.tsx`. The a11y addon runs in Storybook — fix accessibility violations before exporting a component.

## Conventions

| Topic | Rule |
|---|---|
| Install target | This package owns every UI component. Apps consume `@repo/ui` and never run the shadcn CLI themselves. |
| Primitives | Install/update via the shadcn CLI. Never hand-edit `components/ui`. |
| Form fields | Keep primitives presentational and controller-agnostic. Bind to RHF via `Controller` only when used inside a form; validation stays in the app. |
| Styling | Compose classes with `cn`. Define variants with `cva`, never string concatenation. |
| Slots | Split compound components into `<component>.<slot>.tsx` and assemble with `Object.assign`. |
| Client components | Add `"use client"` only when hooks, events, or browser APIs are used. |
| Quality gate | Ship a Storybook story + Vitest test for every custom component. |
| Imports | Consume from scoped paths (`@repo/ui/components/*`). Never deep-import internal files. |
