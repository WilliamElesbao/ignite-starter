---
name: writing-commit-messages
description: Use when writing a git commit message, staging changes for a commit, running git commit, amending or rewording a commit, or deciding how to split work into commits.
model: haiku
---

# Writing Commit Messages

## Overview

Every commit message completes one sentence:

> **If applied, this commit will \_\_\_**

The subject line is the ending of that sentence. The wrapper is
[Conventional Commits](https://www.conventionalcommits.org/): `type(scope): subject`.

## The Contract

A commit message has these parts, in this order:

1. **Subject** — `type(scope): ` followed by the ending of "If applied, this
   commit will \_\_\_". Imperative mood, lowercase after the colon, no trailing
   period, 72 characters or fewer.
2. **Body** (optional; blank line before it) — why the change is needed and what
   goes wrong without it. Wrapped at 72 characters.
3. **Trailers** (optional; blank line before them) — `BREAKING CHANGE: ...`,
   `Refs: #123`, `Co-Authored-By: ...`.

Read your subject back with the prefix attached. If the result is not a
grammatical English sentence, the subject is wrong:

| Subject                                        | Reads back as                                     |                |
| ---------------------------------------------- | ------------------------------------------------- | -------------- |
| `fix(invoice): return 404 for missing orders`  | "…this commit will return 404 for missing orders" | ✅             |
| `fix(invoice): returns 404 for missing orders` | "…this commit will returns 404…"                  | ❌ indicative  |
| `fix(invoice): fixed the null crash`           | "…this commit will fixed the null crash"          | ❌ past tense  |
| `fix(invoice): null check on order lookup`     | "…this commit will null check on order lookup"    | ❌ noun phrase |
| `refactor(payments): retry logic cleanup`      | "…this commit will retry logic cleanup"           | ❌ noun phrase |

The test catches mood errors that "use the imperative" alone does not: a subject
can be a perfectly good noun phrase and still fail to finish the sentence.

## English Always

Write the whole message in English — subject, body, and trailers.

This holds regardless of the language of the repository's existing commits, the
language of the conversation you are having with the user, and the language of
the code's comments and identifiers. A repository whose history is entirely in
another language still gets English commit messages from here on.

Mirroring the surrounding language is the most common way this skill gets
violated, and it happens without the violation feeling like a choice.

## One Commit, One Ending

The sentence has exactly one ending. If yours needs "and" to join unrelated
changes, you are looking at more than one commit.

A staged set containing a token-entropy change, a new log line, a test, and a
README note is four endings:

```
❌ fix(auth): increase session token entropy to 32 bytes

    Also adds a session creation log, a test for token length, and a
    README note about the 1 hour expiry.
```

```
✅ fix(auth): widen session tokens from 16 to 32 bytes
✅ test(auth): cover session token length
✅ feat(auth): log session creation
✅ docs(auth): document the one hour session expiry
```

Split with `git add -p`. When splitting is genuinely impossible — a refactor that
only compiles as one unit — pick the type of the dominant change and let the body
carry the rest.

## Types

| Type       | Use for                                                        |
| ---------- | -------------------------------------------------------------- |
| `feat`     | a capability the user did not have before                      |
| `fix`      | behaviour that was wrong and is now correct                    |
| `perf`     | same behaviour, measurably faster or cheaper                   |
| `refactor` | same behaviour, different structure                            |
| `style`    | formatting only — whitespace, quotes, semicolons, import order |
| `test`     | tests only                                                     |
| `docs`     | documentation only                                             |
| `build`    | build system, dependencies, packaging                          |
| `ci`       | pipeline configuration                                         |
| `chore`    | housekeeping that touches no source behaviour                  |
| `revert`   | undoing a previous commit                                      |

Scope is the affected area — package, module, or domain (`api`, `db`, `auth`).
Omit it rather than inventing a vague one.

Breaking changes take a `!` before the colon and a `BREAKING CHANGE:` trailer:

```
feat(api)!: require tenant id on every order endpoint

BREAKING CHANGE: clients that omit tenant_id now receive 400.
```

## What the Body Is

Skip the body when the subject already says everything. Write one when the
reader will ask "why?" — a non-obvious tradeoff, a subtle bug mechanism, a
constraint that forced the approach.

The body states the change and its motivation in the present tense. It is a
description of the commit, not a report of your working session.

```
❌ I went through the payments module and pulled the retry logic out of
   the three places it was duplicated, then wired all three call sites up.
   Behavior is identical, I just couldn't stand the duplication.
```

```
✅ Retry behaviour had drifted between the three payment clients: only the
   Stripe path backed off exponentially. A shared helper makes the backoff
   policy one decision instead of three.
```

## Quick Reference

```
<type>[optional scope][!]: <ending of "if applied, this commit will ___">

<body: why, present tense, wrapped at 72>

<trailers>
```

- English, always
- Imperative, lowercase, no trailing period
- Subject ≤ 72 characters
- One commit, one ending
- Body says why, not what you did this afternoon

## Common Mistakes

| Mistake                                             | Fix                                                           |
| --------------------------------------------------- | ------------------------------------------------------------- |
| Subject in the repository's language                | English, always                                               |
| `adds`, `adding`, `added`                           | `add`                                                         |
| `updates to the parser`                             | `update the parser`                                           |
| Subject describes the file touched                  | Describe the effect, not the path                             |
| `chore: changes` / `fix: bug`                       | Say what changes, say which bug                               |
| Body retells the diff line by line                  | The diff is already in the commit; say why                    |
| Unrelated changes bundled under time pressure       | `git add -p` and split                                        |
| Type chosen by file extension (`.test.ts` → `test`) | A test that proves a fix is part of the `fix`                 |
| Formatter-only diff filed as `chore`                | `style` exists for exactly that                               |
| Structural rewrite filed as `style`                 | `style` never changes what the code means; that is `refactor` |

## Red Flags

Stop and rewrite when you catch yourself:

- Writing the subject in any language other than English
- Joining the subject with "and", "plus", or a comma splice
- Starting the body with "I " or "We "
- Reaching for `chore` because choosing a real type requires reading the diff
- Thinking "the message doesn't matter, it's a small commit"
- Thinking "I'll fix the message when I squash"
- Under deadline pressure, staging everything at once to save a round trip
