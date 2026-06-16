You are an expert in Next.js, frontend architecture, and design. This app is the Next.js 16 frontend (React 19, Tailwind v4, shadcn/ui, next-intl). The architecture is **feature-based**: complex components use the compound pattern, hooks are grouped by domain, and library configuration is centralized.

## Directory Structure

```text
src/
├── app/          # App Router — route segments only (thin re-exports)
├── components/   # App-specific compositions built from @repo/ui (no installed primitives)
├── constants/    # Global typed constants
├── contexts/      # Global React contexts — only when state is truly app-wide
├── features/      # Feature modules (auth, dashboard…) — where product code lives
├── hooks/        # Shared domain hooks (email, locale, stripe, user)
├── lib/          # Third-party library configuration and clients
├── middleware/   # Middleware split by responsibility, composed in proxy.ts
├── providers/    # Global app-level providers
├── styles/       # globals.css (Tailwind v4 tokens)
└── utils/        # Pure utility functions
```

## Routing — `src/app/`

Create every page inside `src/app/[locale]/` so next-intl can resolve the active locale. Never create pages outside `[locale]/`. Use route groups (`(auth)/`, `(dashboard)/`) to separate layouts without changing URLs.

Page files are **thin re-exports** from feature modules, with a server-side auth guard where needed:

```ts
// app/[locale]/(auth)/sign-in/page.tsx
export { SignInPage as default } from "@/features/auth";
```

## Components — `src/components/`

**Never install UI components into this app.** Install and build them in `@repo/ui` (shadcn primitives, variant components) and import them from there. This keeps the design system in one place and reusable across apps.

`src/components/` holds only **app-specific compositions** assembled from `@repo/ui` — shared shells not tied to a single feature (`app-sidebar`, `theme-toggle`, `language-switcher`). Feature-specific components live in `src/feature/<name>/components/`.

```ts
// Consume primitives from the shared library, never a local copy
import { Button, Input } from "@repo/ui/components/button";
```

## Features — `src/features/`

Each feature is self-contained: its own `components/`, `hooks/`, and pages. The `index.ts` exposes **only page components** as the public API.

### Compound Component Pattern

Complex components compose named slots with `Object.assign`. Each slot is a `<component>.<slot>.tsx` file. `AuthForm` is the canonical example — one component serves sign-in and sign-up by composing different slots:

```tsx
export const AuthForm = Object.assign(AuthFormRoot, {
  Form: AuthFormContainer,   Header: AuthFormHeader,
  Field: AuthFormField,      Submit: AuthFormSubmit,
  Separator: AuthFormSeparator, Socials: AuthFormSocials,
});

// Usage
<AuthForm>
  <AuthForm.Header mode="sign-in" />
  <AuthForm.Form form={form} onSubmit={onSubmit}>
    <AuthForm.Field form={form} name="email" label="Email" type="email" />
    <AuthForm.Submit>Sign In</AuthForm.Submit>
    <AuthForm.Socials signInWithGoogle={signInWithGoogle} />
  </AuthForm.Form>
</AuthForm>
```

Reach for this pattern when a component has distinct slots, multiple valid compositions, or more than ~5 props.

### Feature Hooks & Schemas

Hooks in `feature/<name>/hooks/` are **private to that feature** — never import them from outside. Co-locate Zod schemas as factory functions that accept `useTranslations()` output so validation messages stay i18n-aware:

```ts
export function signInFormSchema(t: TranslationFn) {
  return z.object({
    email: z.string().email(t("validation.email")),
    password: z.string().min(8, t("validation.password")),
  });
}
```

### Forms — Zod + React Hook Form

Build every **form** with **React Hook Form** driven by **Zod** through `zodResolver`, and never manage form state by hand.

`Controller` is a form-binding tool, **not** a requirement for using a primitive. Wrap a field in `Controller` only when it is part of an RHF form that needs validation, value, and error tracking:

```ts
const form = useForm<SignInValues>({
  resolver: zodResolver(signInFormSchema(t)),
  defaultValues: { email: "", password: "" },
});
```

```tsx
<Controller
  control={form.control}
  name="email"
  render={({ field, fieldState }) => (
    <Input {...field} error={fieldState.error?.message} />
  )}
/>
```

A primitive used **outside a form** — a theme toggle, a language switcher, a standalone filter — takes no `Controller`. Use it directly with its own handler or local state:

```tsx
<Select value={locale} onValueChange={setLocale}>{/* … */}</Select>
```

## Shared Hooks — `src/hooks/`

Hooks shared across features, grouped by domain (`email/`, `locale/`, `stripe/`, `user/`). Separate the data layer from the interaction layer:

- `<domain>.queries.ts` / `<domain>.mutations.ts` — raw TanStack Query hooks, no UI logic.
- `use<Domain>.ts` — business wrappers that add toasts, `invalidateQueries`, dialog close, etc.

```ts
export function useSubscription() {
  const { mutateAsync } = useStripeSubscription();
  const onSubscribe = async (data) => {
    const [result, error] = await safePromise(mutateAsync(data));
    if (error) return toast.error("…");
    toast.success("…");
    queryClient.invalidateQueries(/* … */);
  };
  return { onSubscribe };
}
```

## State & Context

Keep state as close to where it is used as possible.

- **Feature-scoped context first.** A context used by one feature lives inside that feature's tree, not in `src/contexts/`. Each context file exports a `Provider` and a typed `use<Name>()` hook that throws outside its boundary.
- **Promote only when shared.** When a second feature genuinely needs the same context, lift it one level up to the nearest common ancestor — no higher.
- **Global context is the exception.** Put a context in `src/contexts/` only when the state is truly app-wide (e.g. the authenticated user). Default to local.
- **Reach for a store when context strains.** For high-frequency or complex client state where context causes re-render churn, use **Jotai** (atomic) or **Zustand** (store) instead of widening a context. Server state still belongs in TanStack Query, not a store.

## Library Configuration — `src/lib/`

Configure every third-party library once here and re-export. Never configure a library inline in a component.

| Sub-directory | What lives here |
|---|---|
| `better-auth/` | `auth-client.ts` (client components), `auth-server.ts` (`"use server"` session), `User` type |
| `i18n/` | Routing config, locale-aware navigation, message loading |
| `react-query/` | Single `queryClient`; `refetchOnWindowFocus: false` |
| `dayjs/` | dayjs + `utc`/`timezone` plugins |
| `shadcn/` | `cn()`, `useIsMobile()` |

Use `authClient` in client components; use `getSession()` (from `auth-server.ts`) in server components and protected pages.

## Middleware — `src/middleware/`

Split by responsibility and composed in `proxy.ts` (the Next.js middleware entry): `i18n.ts` (locale routing) → `auth.ts` (session validation/redirects) → `cookies.ts` (clears stale better-auth cookies). Add new concerns as separate files and compose them in `proxy.ts`.

## Utilities — `src/utils/`

Pure, side-effect-free functions, re-exported from `index.ts`. `safePromise(promise)` returns `[value, null] | [null, Error]` and is the preferred error-handling primitive across the app — use it instead of try/catch in hooks and server actions. Others: `safeFetch`, `delay`, `formatPrice`, `getInitials`.

## Key Conventions

| Topic | Rule |
|---|---|
| Server vs Client | Default to server components. Add `"use client"` only for hooks, events, or browser APIs. |
| Auth guard | Two layers: middleware redirect + `getSession()` in server pages. |
| UI components | Install/build in `@repo/ui`. Never install primitives into this app; import from `@repo/ui`. |
| Forms | Zod + React Hook Form via `zodResolver`. Wrap fields in a `Controller` **only inside a form**; standalone primitives (theme/language toggles) need none. Co-locate the schema as an i18n-aware factory. |
| State & context | Prefer feature-scoped context; promote only when shared; global only when app-wide. Use Jotai/Zustand for performant client state. |
| API access | Use generated hooks from `@repo/api`, wrapped by domain hooks in `src/hooks/`. |
| Error handling | Use `safePromise`, not try/catch. Handle errors at the hook level. |
| New feature | Add a folder in `src/features/`, a thin page in `app/[locale]/`, and export the page from `features/index.ts`. |
| Magic strings | Extract to `src/constants/`. |
