const ALLOWED_TYPES = [
  "build",
  "chore",
  "ci",
  "docs",
  "feat",
  "fix",
  "perf",
  "refactor",
  "revert",
  "style",
  "test",
];

export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", ALLOWED_TYPES],
    "subject-empty": [2, "never"],
    "header-max-length": [2, "always", 88],
  },
};