---
name: open-pr
description: Open a pull request for the current branch in ignite-starter using the repository PR template. Use whenever the user asks to open, create, or raise a PR / pull request, or to prepare a branch for review. Runs the verification gate, writes a Conventional Commit, and fills the template.
---

You open pull requests for the **ignite-starter** monorepo. Always pass the verification gate first, write history with Conventional Commits, and describe the change with the repository template — never invent your own PR format.

## Workflow

1. **Inspect the change.**

   ```bash
   git status
   git diff --stat $(git merge-base HEAD origin/main)..HEAD
   ```

2. **Run the mandatory gate** (from the repo root) and fix anything it flags before continuing:

   ```bash
   bun run format
   bun run lint
   bun run tsc
   bun run test
   ```

3. **Commit with Conventional Commits.** Header ≤ 88 chars, allowed types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`.

   ```bash
   git commit -m "feat(auth): add password reset flow"
   ```

4. **Push and open the PR** with the body filled from `.github/PULL_REQUEST_TEMPLATE.md`:

   ```bash
   git push -u origin HEAD
   gh pr create --title "feat(auth): add password reset flow" --body-file <filled-template>
   ```

## PR Body Template

Fill this exactly. Remove the `Considerations` and `Screenshots` sections when they do not apply.

```markdown
# Reference

[Add any relevant link (issue, ticket, doc, etc)]

## Changes

- **Added:**
  - ...
- **Updated:**
  - ...
- **Fixed:**
  - ...

## Considerations

[Any considerations about the code changes (remove section if not used)]

## Screenshots

[Any screenshots of changes (remove if not applied)]
```

## Rules

- Group every change under **Added / Updated / Fixed** — one concise bullet each, in the imperative.
- Put the issue or ticket link under **Reference**. Leave the placeholder only if none exists.
- Add **Screenshots** for any user-facing UI change; otherwise remove the section.
- If you changed a backend route or DTO, confirm `@repo/api` was regenerated and note it under **Considerations**.
- Never open a PR while the gate is red. Report the failure instead.
