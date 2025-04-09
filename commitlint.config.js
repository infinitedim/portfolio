/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
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
      ],
    ],
    "subject-case": [
      2,
      "always",
      [
        "sentence-case",
        "start-case",
        "pascal-case",
        "upper-case",
        "lower-case",
      ],
    ],
    "body-leading-blank": [1, "always"],
    "footer-leading-blank": [1, "always"],
  },
};
