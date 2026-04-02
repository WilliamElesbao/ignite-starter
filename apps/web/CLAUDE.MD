# CLAUDE.md — apps/web

## Overview

Next.js 16 frontend using React 19, Tailwind v4, shadcn/ui, and next-intl for i18n. Architecture is feature-driven with a strict composition pattern for complex components, domain-grouped hooks, and centralized library configuration.

---

## Directory Structure

```
src/
├── app/            # Next.js App Router — route segments only
├── components/     # Installed UI library components (shadcn/ui, origin-ui, shared app components)
├── constants/      # Global typed constants
├── context/        # React contexts for shared scoped state
├── feature/        # Feature modules (auth, dashboard, etc.)
├── hooks/          # Shared domain hooks (email, locale, stripe, user)
├── lib/            # Third-party library configuration and clients
├── middleware/     # Middleware functions split by responsibility
├── providers/      # Global app-level providers
├── proxy.ts        # Next.js middleware entry point
├── styles/         # Global CSS (globals.css)
└── utils/          # Pure utility functions
```

---

## Routing — `src/app/`

All pages **must** be created inside `src/app/[locale]/` so next-intl can resolve and inject the active locale. Never create pages outside `[locale]/`.

- `app/layout.tsx` — Root layout: applies global font, wraps app in `Providers`.
- `app/[locale]/layout.tsx` — Locale layout: validates locale, provides `NextIntlClientProvider`.
- Route groups (e.g., `(auth)/`, `(dashboard)/`) separate layout concerns without affecting URL paths.

Page files are **thin re-exports** from feature modules:

```ts
// app/[locale]/(auth)/sign-in/page.tsx
export { SignInPage as default } from "@/feature/auth";
```

Protected pages call `getSession()` server-side for a redundant auth guard in addition to the middleware layer.

---

## Components — `src/components/`

This directory is where UI library components are **installed**, not authored from scratch.

- `ui/` — shadcn/ui primitives (Button, Input, Form, Dialog, etc.). Update via shadcn CLI; do not hand-edit.
- `origin-ui/` — OriginUI components (custom dialogs, enhanced badges). Same rule applies.
- Top-level files — Shared application components not tied to a single feature (e.g., `app-sidebar`, `theme-toggle`, `language-switcher`, `data-table`).

Feature-specific components live in `src/feature/<name>/components/`, not here.

---

## Constants — `src/constants/`

Global typed constants to avoid magic strings across components, hooks, and pages. All constants are re-exported from `src/constants/index.ts`.

Add a new file per concern (e.g., `session-storage.ts`, `sidebar/sidebar-options.ts`):

```ts
export const WELCOME_TOAST = { key: "welcome", value: "true" };
```

---

## Context — `src/context/`

Use contexts when a component tree needs to share state where:
- A parent must expose state to deeply nested children, **or**
- Children need to trigger state updates in a shared scope.

Each context file exports both a `Provider` component and a typed `use<Name>()` hook that throws if used outside the provider boundary.

Feature-scoped contexts (e.g., dialog state only needed inside one feature) are placed locally inside that feature's component tree — not in `src/context/`.

---

## Features — `src/feature/`

All product features are built here. Each feature is self-contained with its own components, hooks, and pages.

```
feature/
└── auth/
    ├── index.ts               # Public API: exports page components only
    ├── components/            # Feature-specific components (composition pattern)
    ├── hooks/                 # Feature-scoped hooks (not imported from outside)
    ├── sign-in/               # Sub-feature: page + form component + hooks
    └── sign-up/               # Sub-feature: page + form component + hooks
```

### Composition Pattern

Complex components use the **compound component pattern** via `Object.assign`. Each visual slot is a separate file named `<component>.<slot>.tsx`. The root export combines all slots under a single namespaced component.

The `AuthForm` component is the canonical example — it is reused for both sign-in and sign-up by composing different slots:

```ts
// feature/auth/components/index.tsx
export const AuthForm = Object.assign(AuthFormRoot, {
  Form: AuthFormContainer,     // Wraps RHF <Form> + <FieldGroup>
  Header: AuthFormHeader,      // Icon, title, sign-in/up link toggle
  Field: AuthFormField,        // Generic controlled RHF field with label/error
  Submit: AuthFormSubmit,      // Submit button wrapper
  Separator: AuthFormSeparator,// "Or" divider
  Socials: AuthFormSocials,    // Google / Apple OAuth buttons
  Description: AuthFormDescription,
});
```

Usage in a page:
```tsx
<AuthForm>
  <AuthForm.Header mode="sign-in" />
  <AuthForm.Form form={form} onSubmit={onSubmit}>
    <AuthForm.Field form={form} name="email" label="Email" type="email" />
    <AuthForm.Field form={form} name="password" label="Password" type="password" />
    <AuthForm.Submit>Sign In</AuthForm.Submit>
    <AuthForm.Separator />
    <AuthForm.Socials signInWithGoogle={signInWithGoogle} />
  </AuthForm.Form>
  <AuthForm.Description />
</AuthForm>
```

Apply this pattern when a component has distinct visual slots, multiple valid compositions, or more than ~5 configuration props.

### Feature Hooks

Hooks inside `feature/<name>/hooks/` or `feature/<name>/<sub>/hooks/` are **private to that feature**. Do not import them from outside the feature.

Form schemas are co-located with their hook as factory functions that accept `useTranslations()` output, making validation messages i18n-aware:

```ts
// form.schema.ts
export function signInFormSchema(t: TranslationFn) {
  return z.object({
    email: z.string().email(t("validation.email")),
    password: z.string().min(8, t("validation.password")),
  });
}
```

---

## Shared Hooks — `src/hooks/`

Hooks shared across multiple features or pages. Organized by domain:

```
hooks/
├── email/    # useSendEmail (mutation) + useEmail (toast wrapper)
├── locale/   # useLocaleLabel — maps locale code to display label
├── stripe/   # stripe.queries.ts, stripe.mutations.ts, useSubscription.ts, useSubscriptionForm.ts
└── user/     # useGetSession, useGetUserById
```

**Pattern — separate data layer from interaction layer:**

- `<domain>.queries.ts` / `<domain>.mutations.ts` — Raw TanStack Query hooks. No UI logic.
- `use<Domain>.ts` — Business wrappers that add toasts, `queryClient.invalidateQueries`, `delay`, dialog close, etc.

```ts
// stripe.queries.ts — data layer (thin)
export const useGetStripeProducts = () =>
  useQuery({ ...getStripeProductsOptions() });

// useSubscription.ts — interaction layer (business logic)
export function useSubscription() {
  const { mutateAsync } = useStripeSubscription();
  const onSubscribe = async (data) => {
    const [result, error] = await safePromise(mutateAsync(data));
    if (error) { toast.error("..."); return; }
    toast.success("...");
    queryClient.invalidateQueries(...);
  };
  return { onSubscribe };
}
```

---

## Library Configuration — `src/lib/`

All third-party libraries are configured once here and re-exported. Never configure a library inline inside a component.

| Sub-directory | What lives here |
|---|---|
| `better-auth/` | Auth client (client), server action for session (`auth-server.ts`), `User` type |
| `i18n/` | Routing config, locale-aware navigation helpers, message loading, type augmentation |
| `react-query/` | Single `queryClient` with global error logging; `refetchOnWindowFocus: false` |
| `dayjs/` | dayjs extended with `utc` + `timezone` plugins |
| `shadcn/` | `cn()` (clsx + tailwind-merge), `useIsMobile()` |

### Auth Client vs Auth Server

- **`auth-client.ts`** — Used in **client components**. `createAuthClient` pointing to backend API with `credentials: "include"`.
- **`auth-server.ts`** — `"use server"` action. Fetches session server-side using `next/headers` cookies. Used in server components and protected route pages.

```ts
// Client component
import { authClient } from "@/lib/better-auth/auth-client";
await authClient.signIn.social({ provider: "google" });

// Server component / page
import { getSession } from "@/lib/better-auth/auth-server";
const session = await getSession();
if (!session) redirect("/sign-in");
```

---

## Middleware — `src/middleware/`

Split by responsibility, composed in `proxy.ts`:

| File | Responsibility |
|---|---|
| `i18n.ts` | Locale detection and URL rewriting (next-intl) |
| `auth.ts` | Session validation; redirects unauthenticated users or clears stale cookies |
| `cookies.ts` | Deletes better-auth session cookies from a `NextResponse` |

`proxy.ts` is the actual Next.js `middleware.ts` entry point and orchestrates the pipeline in order: i18n routing → locale resolution → auth handling.

Add new middleware concerns as separate files and compose them in `proxy.ts`.

---

## Providers — `src/providers/`

Global providers wrapping the entire application. Only app-wide concerns belong here (theme, query client, toast). Feature-specific providers go inside the feature.

Current global providers: `NextThemesProvider` → `QueryClientProvider` → `Toaster`.

---

## Styles — `src/styles/`

Global CSS and Tailwind v4 design token configuration live in `globals.css`. Component-level styles use Tailwind utility classes — no CSS modules or styled-components.

---

## Utilities — `src/utils/`

Pure, side-effect-free functions. All re-exported from `src/utils/index.ts`.

| Utility | Description |
|---|---|
| `safePromise(promise)` | Returns `[value, null] \| [null, Error]` — eliminates try/catch boilerplate |
| `safeFetch(url, init, schema)` | fetch + safePromise + Zod parse; returns typed data or null |
| `delay(seconds)` | Promise-based timeout |
| `formatPrice({ currency, price })` | Cents → formatted currency string via `Intl.NumberFormat` |
| `getInitials(name)` | "John Doe" → "JD" |

`safePromise` is the preferred error-handling primitive across the whole codebase — use it instead of try/catch in hooks and server actions.

---

## Internationalization

- All user-visible strings use `useTranslations()` from next-intl.
- Translation keys are type-safe via the augmented `AppConfig` in `src/lib/i18n/global.ts`.
- Locale files: `src/lib/i18n/locales/en.json`, `pt-BR.json`.
- Use `Link`, `redirect`, `useRouter`, `usePathname` from `src/lib/i18n/navigation.ts` (locale-aware), **not** from `next/navigation`.

---

## Key Conventions

| Topic | Rule |
|---|---|
| Server vs Client | Default to server components. Add `"use client"` only when hooks, event handlers, or browser APIs are needed. |
| Auth guard | Two layers: middleware (fast redirect) + `getSession()` in server page components. |
| Form validation | Always Zod. Co-locate schema with its hook. Make schemas factory functions for i18n error messages. |
| API queries/mutations | Use generated hooks from `@repo/api`. Wrap with domain hooks in `src/hooks/` for business logic. |
| Error handling | Use `safePromise` instead of try/catch. Handle errors at the hook level, not the component level. |
| Magic strings | Extract to `src/constants/`. |
| New feature | Create a folder in `src/feature/`, add a thin page in `app/[locale]/`, export page from `feature/index.ts`. |
