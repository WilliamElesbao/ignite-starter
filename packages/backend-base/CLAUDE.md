# AI Agent Error Handling Guide (Backend Base)

This document is for coding agents (Claude, Copilot, etc.) working in `packages/backend-base`.

It defines the **mandatory error-handling contract** and the expected implementation pattern for new or modified features.

---

## 1) Why this exists

The backend uses typed, feature-scoped error codes so the frontend can:

- render backend messages directly, or
- map error codes to localized/custom UI messages.

This keeps API behavior predictable and maintenance scalable as the project grows.

---

## 2) Non-negotiable API error contract

All API error responses must return:

```json
{
  "code": "SOME_ERROR_CODE",
  "message": "Human-readable message"
}
```

`code` is **required**.
`message` is **required**.

In code, this is enforced by:

- `src/shared/dtos/error.dto.ts`

```ts
export const ErrorDto = t.Object({
  code: t.String(),
  message: t.String(),
});
```

---

## 3) Architecture overview

### 3.1 Shared base

- `src/shared/errors/error-catalog.ts`
  - `ErrorCatalog<TCode>`
  - `ErrorDefinition` (`message`, `status`)
- `src/shared/errors/app-error.ts`
  - `AppError`
  - `AppError.fromCatalog(...)`
  - `AppError.fromUnknown(...)`
- `src/shared/errors/to-error-response.ts`
  - `toErrorResponse(error, fallback?)`
  - normalizes unknown errors to `{ status, body: { code, message } }`
- `src/shared/errors/shared.errors.ts`
  - shared infra errors for global fallback (`INTERNAL_SERVER_ERROR`, validation, etc.)
- `src/shared/shared.plugin.ts`
  - global `onError` hook
  - single place that serializes API errors

### 3.2 Feature-scoped error files

Each feature owns its own enum + map:

- `src/plugins/auth/auth.errors.ts`
- `src/plugins/email/email.errors.ts`
- `src/plugins/stripe/stripe.errors.ts`
- `src/plugins/user/user.errors.ts`

Each file defines:

1. `enum <Feature>ErrorCode`
2. `<FEATURE>_ERROR_MAP: ErrorCatalog<<Feature>ErrorCode>`

### 3.3 Error response DTOs (organized by feature)

Error response schemas used in route `response` docs must live in DTO folders, not inline inside plugins.

Pattern:

- `src/plugins/<feature>/dtos/errors/*.dto.ts`

Examples currently used:

- `src/plugins/auth/dtos/auth-error.dto.ts`
- `src/plugins/email/dtos/errors/email-error.dto.ts`
- `src/plugins/user/dtos/errors/user-error.dto.ts`
- `src/plugins/stripe/dtos/errors/stripe-error.dto.ts`

These DTOs should be created with `createErrorDto([...codes])` so OpenAPI includes enum-constrained `code` values per endpoint/status.

---

## 4) Mandatory rules for agents

1. **Never introduce optional `code` in API errors.**
2. **Never return error payloads without `code`.**
3. **Never add new feature errors to shared/global enums.**
4. **Always define errors in the feature-specific `*.errors.ts`.**
5. **Always include both `code` and `message` in plugin error responses.**
6. **Use `AppError.fromCatalog` in services for expected failures.**
7. **Use global `onError` + `toErrorResponse` for HTTP serialization.**
8. **Match route OpenAPI/DTO responses (`ErrorDto`) for error status codes.**
9. **In plugins/routes, prefer throwing typed errors instead of local `try/catch` blocks.**
10. **For expected domain states (not technical failures), prefer `200` payload semantics instead of forcing error HTTP codes.**
11. **Do not define error DTO constants inline in plugin files; place them under `dtos/errors`.**
12. **For documented error responses, use `createErrorDto([...codes])` to expose possible error enums in generated clients.**

---

## 5) How to add a new error (feature workflow)

### Step 1: Add enum value + map entry

In `<feature>.errors.ts`:

```ts
export enum BillingErrorCode {
  BILLING_INVOICE_NOT_FOUND = "BILLING_INVOICE_NOT_FOUND",
}

export const BILLING_ERROR_MAP: ErrorCatalog<BillingErrorCode> = {
  [BillingErrorCode.BILLING_INVOICE_NOT_FOUND]: {
    message: "Invoice not found",
    status: 404,
  },
};
```

### Step 2: Throw typed errors in service layer

```ts
throw AppError.fromCatalog({
  code: BillingErrorCode.BILLING_INVOICE_NOT_FOUND,
  catalog: BILLING_ERROR_MAP,
});
```

### Step 3: Normalize and return in plugin layer

```ts
if (!user) {
  throw AppError.fromCatalog({
    code: AuthErrorCode.AUTH_UNAUTHORIZED,
    catalog: AUTH_ERROR_MAP,
  });
}

const result = await billingService.getInvoice(...);
return result;
```

The global `onError` in `shared.plugin.ts` serializes any thrown error via `toErrorResponse`.

### Step 4: Keep route response contract updated

Ensure error statuses reference `ErrorDto`:

```ts
response: {
  200: SuccessDto,
  400: ErrorDto,
  404: ErrorDto,
  500: ErrorDto,
}
```

When possible, prefer feature DTO exports built with enum-constrained codes, for example:

```ts
// dtos/errors/user-error.dto.ts
export const userNotFoundErrorDto = createErrorDto([
  UserErrorCode.USER_NOT_FOUND,
] as const);

// plugin response
response: {
  404: userNotFoundErrorDto,
}
```

---

## 6) Layer responsibilities

### Service layer

- Encapsulates domain/provider/db failures.
- Throws `AppError` built from feature catalog.
- May override default `message`/`status` when needed.
- Should not return ad-hoc `{ error: ... }` objects.

### Plugin/controller layer

- Handles HTTP concerns (`set.status`, response payload).
- Should throw typed errors for business/auth/guard failures.
- Should avoid repetitive route-level `try/catch` unless there is a specific local reason.
- Relies on global `onError` to return standardized payload: `{ code, message }`.
- Can return valid `200` state payloads when business state is expected (e.g., user has no active subscription).
- Should import error response DTOs from `dtos/errors` rather than declaring them locally.

### Global `onError` layer (`shared.plugin.ts`)

- Catches thrown errors across routes using `shared` plugin.
- Calls `toErrorResponse` to normalize unknown or typed errors.
- Sets HTTP status and returns the mandatory API contract (`code`, `message`).

---

## 7) Auth-specific rule

For unauthorized access, reuse auth feature errors:

- `AuthErrorCode.AUTH_UNAUTHORIZED`
- `AUTH_ERROR_MAP[AuthErrorCode.AUTH_UNAUTHORIZED]`

Do not hardcode `"Unauthorized"` or raw `401` in scattered places when the auth catalog should be used.

---

## 8) Do / Don’t

### Do

- Add errors per feature.
- Keep error names explicit and stable.
- Use provider-specific codes where helpful (Stripe, Email, etc.).
- Preserve frontend contract (`code` + `message`).

### Don’t

- Reintroduce global mixed enums for all features.
- Return plain `{ message }` for errors.
- Throw raw strings or untyped objects.
- Hide failures in service `catch` blocks without throwing.
- Duplicate error serialization logic in many route handlers.
- Declare route error DTOs inline inside plugin files.

---

## 9) Suggested naming convention

Format:

`<FEATURE>_<CONTEXT>_<FAILURE_TYPE>`

Examples:

- `STRIPE_SUBSCRIPTION_RETRIEVE_FAILED`
- `EMAIL_PROVIDER_ERROR`
- `USER_FETCH_FAILED`
- `AUTH_SESSION_RESOLVE_FAILED`

---

## 10) Quality checklist before finishing a change

- [ ] Feature has its own `*.errors.ts`
- [ ] New errors added to feature enum + map
- [ ] Services throw `AppError.fromCatalog(...)`
- [ ] Plugins throw typed errors for guard/business failures
- [ ] Global `onError` + `toErrorResponse` is used for serialization
- [ ] Every error response returns `code` and `message`
- [ ] Expected domain states that are not technical failures are modeled as `200` payloads
- [ ] Route response schema includes `ErrorDto` for error statuses
- [ ] Route error DTOs are stored in `dtos/errors` and imported into plugin files
- [ ] Enum-constrained `code` values are documented per endpoint/status (via `createErrorDto`)
- [ ] Typecheck passes (`bunx tsc -p packages/backend-base/tsconfig.json --noEmit`)

---

## 11) Special case: Stripe subscription details endpoint

Endpoint: `GET /stripe/subscription/details`

Behavior rules:

- If user has active subscription: return `200` with `hasActiveSubscription: true` and normalized subscription details.
- If user has no active subscription: return `200` with `hasActiveSubscription: false` and an informational `code` + `message`.
- Do **not** return `404` for this case; "no subscription" is an expected user state, not a missing API resource.

Recommended shape when no subscription exists:

```json
{
  "hasActiveSubscription": false,
  "code": "STRIPE_SUBSCRIPTION_NOT_FOUND",
  "message": "User has no active subscription"
}
```

This allows frontend to:

- branch safely using `hasActiveSubscription`, and
- optionally use `code` for custom UX decisions.

---

## 12) Reference files (current implementation)

- `packages/backend-base/src/shared/errors/app-error.ts`
- `packages/backend-base/src/shared/errors/error-catalog.ts`
- `packages/backend-base/src/shared/errors/to-error-response.ts`
- `packages/backend-base/src/shared/errors/shared.errors.ts`
- `packages/backend-base/src/shared/shared.plugin.ts`
- `packages/backend-base/src/shared/dtos/error.dto.ts`
- `packages/backend-base/src/plugins/auth/auth.errors.ts`
- `packages/backend-base/src/plugins/auth/dtos/auth-error.dto.ts`
- `packages/backend-base/src/plugins/email/email.errors.ts`
- `packages/backend-base/src/plugins/email/dtos/errors/email-error.dto.ts`
- `packages/backend-base/src/plugins/stripe/stripe.errors.ts`
- `packages/backend-base/src/plugins/stripe/dtos/errors/stripe-error.dto.ts`
- `packages/backend-base/src/plugins/user/user.errors.ts`
- `packages/backend-base/src/plugins/user/dtos/errors/user-error.dto.ts`

Use these as source of truth for this pattern.
