---
name: security-review
description: Security checklist for code review—validates auth, input validation, secrets, database safety, Stripe integration, XSS prevention, and dependencies
disable-model-invocation: true
---

# Security Review

Audit defensively. Every mutating Server Action authenticates the caller and verifies ownership before it touches data; every external boundary — Stripe webhooks, user input, env access — is validated before it's trusted. Work the checklist top to bottom and treat any unchecked box as a blocker, not a suggestion.

## Checklist

### Authentication & Authorization

- [ ] Every mutating Server Action validates the session before operating
- [ ] Ownership verified: user can only modify their own resources
- [ ] Admin-only routes/actions protected with role check
- [ ] No auth logic duplicated — all session validation via `better-auth`

```ts
// ✅ Required pattern in every mutating Server Action
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';

const session = await auth.api.getSession({ headers: headers() });
if (!session) return { success: false, error: 'Unauthorized' };

// Ownership check — after auth, before mutation
if (resource.userId !== session.user.id) {
  return { success: false, error: 'Forbidden' };
}
```

### Input Validation

- [ ] All Server Action inputs validated with Zod before any DB access
- [ ] Never trust client-sent IDs without a DB-level ownership check
- [ ] Stripe webhook `stripe-signature` header verified on every webhook call

### Environment Variables

- [ ] No secrets in git history
- [ ] All secrets in `.env.local` (gitignored)
- [ ] Every env var declared in `src/env.ts`
- [ ] No `process.env.X` outside `src/env.ts`

### Database (Prisma)

- [ ] Raw DB error messages never returned to client — always a generic string
- [ ] All DB calls wrapped with `safePromise`
- [ ] Queries scoped to the authenticated user's data

```ts
// ❌ Exposes DB internals
catch (e) { return { success: false, error: e.message }; }

// ✅ Generic client error; log real error server-side
const [error] = await safePromise(db.subscription.delete({ where: { id } }));
if (error) {
  console.error('[cancelSubscription]', error);
  return { success: false, error: 'Failed to cancel subscription' };
}
```

### Stripe

- [ ] Webhook handler verifies `stripe-signature` using `STRIPE_WEBHOOK_SECRET`
- [ ] Price/amount calculations done server-side only — never trust client-sent amounts
- [ ] Stripe customer ID stored per user in DB; never re-fetched from client

### XSS & Injection

- [ ] No `dangerouslySetInnerHTML` without explicit sanitisation
- [ ] User-supplied content never interpolated into SQL (Prisma parameterises by default)

### Dependencies

- [ ] `bun audit` run before merging dependency updates
- [ ] No packages from unknown or unmaintained sources

## Vulnerability Reference

| Vulnerability | Mitigation in this project |
|---|---|
| IDOR | Ownership check after session validation |
| Secret exposure | `src/env.ts` + `.env.local` (gitignored) |
| Mass assignment | Zod schema whitelists allowed fields |
| XSS | React escapes by default; no `dangerouslySetInnerHTML` |
| CSRF | Better Auth manages session cookies |
| Webhook spoofing | Stripe signature verification |
| Injection | Prisma parameterised queries |

## Quick Audit Commands

```bash
# Find direct process.env usage (should only be in src/env.ts)
grep -rn "process\.env\." src/ | grep -v "src/env.ts"

# Find dangerouslySetInnerHTML usage
grep -rn "dangerouslySetInnerHTML" src/

# Find unsafe type casts that may mask bad data
grep -rn " as any" src/

# Dependency vulnerability scan
bun audit
```
