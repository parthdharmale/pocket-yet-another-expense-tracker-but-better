# Dependency updates

Dependabot proposes updates; it does not merge them automatically. Review version notes, dependency/peer compatibility and the changed lockfile, then require passing lint, TypeScript, tests, production build and secret checks before merging. Green CI is evidence, not a guarantee that a major upgrade is compatible.

Minor and patch npm updates are grouped into a weekly proposal to reduce notification noise. GitHub Actions minor/patch changes are grouped monthly. Major updates remain separate for deliberate review. CI permissions stay read-only and checkout does not persist credentials.

## ESLint 10 compatibility hold — 15 October 2026

The ESLint 10.12.0 proposal failed while loading `react/display-name`: `contextOrFilename.getFilename is not a function`. The current Next.js lint preset depends on eslint-plugin-react 7.x, whose published peer range supports ESLint through 9, not 10. The preset's broad ESLint peer range alone is therefore insufficient.

Keep the working ESLint 9 configuration and checks intact. ESLint 10.x proposals are temporarily ignored; ESLint 9 patch updates remain eligible. Revisit the hold when the Next.js preset and all of its plugins support ESLint 10. Remove the ignore rule only after a real lint run, full checks and build succeed; do not disable rules or use forced peer installs to make an update appear green.

References: [ESLint 10 migration guide](https://eslint.org/docs/latest/use/migrate-to-10.0.0), [React ESLint plugin](https://github.com/jsx-eslint/eslint-plugin-react), and the failed [update proposal #5](https://github.com/parthdharmale/pocket-yet-another-expense-tracker-but-better/pull/5).
