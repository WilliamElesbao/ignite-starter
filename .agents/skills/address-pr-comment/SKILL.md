---
name: address-pr-comments
description: Process PR comments systematically—read all, categorize, fix blocking items, batch changes, reply to threads, and re-review
disable-model-invocation: true
---

# Addressing PR Comments

## Process

```
1. Read ALL comments before making any changes
2. Group into: must-fix | suggestion | question | nitpick
3. Address all must-fix items first
4. Batch related changes into a single commit per logical concern
5. Reply to every comment thread (fixed / explained / deferred)
6. Push, then request re-review
```

## Comment Categories

| Category | Description | Action |
|---|---|---|
| `[blocking]` | Must be fixed before merge | Fix it |
| `[suggestion]` | Reviewer recommendation | Fix if agreed; explain if not |
| `[question]` | Reviewer needs clarification | Clarify in code or comment |
| `[nitpick]` | Style or minor preference | Fix or defer with an issue |

## Making Changes

```bash
# Always on your feature branch — never commit directly to main
git add -p                         # Interactive staging — only related changes
git commit -m "fix(auth): add Zod validation to sign-in action per PR review"
git push origin feat/my-feature
```

**One commit per logical concern** — not one commit per reviewer comment.

## Response Templates

**After fixing:**
> Fixed in `abc1234`. Added Zod schema validation before the DB call.

**When disagreeing:**
> I've kept the current approach because [reason]. Happy to align if you still feel strongly — let me know.

**When deferring to a follow-up issue:**
> Good catch — created #456 to track this. Keeping this PR focused on the auth flow for now.

**When clarifying (no code change):**
> This is intentional — `safePromise` returns `[null, data]` on success, so the destructuring order is correct. Added a comment for clarity.

## Rules

- Never force-push to a PR branch once review has started
- All comment threads must be resolved before requesting re-review
- Tag reviewers explicitly after pushing (`@reviewer Re-review ready after latest push`)
- Do not add unrelated changes to a PR mid-review — open a separate PR
- Squash at merge time only — keep individual commits readable during review

## Pre-Re-Review Checklist

- [ ] All `[blocking]` comments addressed
- [ ] `bun run lint` passes
- [ ] `bun tsc` passes
- [ ] `bun run test` passes
- [ ] All comment threads resolved or replied to
