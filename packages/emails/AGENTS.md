You are an expert in transactional email built with React Email. This package (`@repo/emails`) holds every email template. `@repo/backend-base` imports and renders these templates — keep their props typed and stable so the backend never breaks.

## Role

`@repo/emails` exports React Email templates through a single entry point:

```ts
// src/index.ts — public surface consumed by @repo/backend-base
export * from "./templates/welcome-email";
```

Import a template from the backend as `@repo/emails/templates`:

```ts
import { WelcomeEmail } from "@repo/emails/templates";
```

Export every production template you want the backend to use from `src/index.ts`. Files under `src/templates/` that are not re-exported (e.g. the bundled demo templates) act as references only.

## Directory Structure

```text
src/
├── index.ts                 # Public exports — backend-facing surface
└── templates/
    ├── welcome-email.tsx     # Production template
    ├── static/               # Static assets (images)
    └── *.tsx                 # React Email demo templates (reference)
```

## Authoring a Template

Build templates from `@react-email/components` and style them with the `Tailwind` component using pixel-based values for email-client compatibility. Type the props with an exported interface, give the component a `Preview` line, and keep a single clear call to action.

```tsx
interface WelcomeEmailProps {
  name: string;        // required: drives personalization
  actionUrl?: string;  // optional: primary CTA target
}

export function WelcomeEmail({ name, actionUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Preview>Welcome aboard, {name}</Preview>
      <Tailwind>{/* Body, Container, Heading, Button… */}</Tailwind>
    </Html>
  );
}
```

## Preview Server

Develop templates visually before wiring them into the backend:

```bash
cd packages/emails && bun dev   # React Email preview on http://localhost:3001
```

The preview server reads `./src/templates`, so every template in that folder renders in the browser.

## Conventions

| Topic | Rule |
|---|---|
| Public API | Re-export production templates from `src/index.ts`. The backend imports only from `@repo/emails/templates`. |
| Props | Type every template with an exported `interface`. Mark optional props with `?`. Never use `any`. |
| Styling | Use the `Tailwind` component with pixel-based classes. Avoid raw CSS and unsupported properties. |
| Compatibility | Build from `@react-email/components` primitives (`Container`, `Button`, `Hr`). Always include `Preview` text. |
| Stability | Treat props as a contract with `@repo/backend-base`. Renaming or removing a prop is a breaking change. |
