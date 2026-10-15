# Contributing

Use Node 24, `npm ci`, then `npm run check` and `npm run build`. You can run tests/build and `/demo` without paid credentials. Real account flows need your own dedicated private Blob store; run `npm run setup` and follow the README.

Please keep changes focused, describe the user-visible behavior, and include relevant verification. Never use real bank statements, payment references, card identifiers, people’s names, emails, recordings or account exports as fixtures. Use the synthetic examples/tests and invented amounts instead.

Preserve integer-paise money calculations, account isolation, versioned writes, future-entry restrictions, refund/cap behavior, and owner-only statement access. Keep deterministic money calculations separate from AI extraction. Review screenshots in both appearances and at mobile width for UI changes. Do not convert points into rupees without an explicitly configured redemption value.

Card catalogue contributions need dated official source links, precise product/network identifiers, cap periods, eligible payment routes, exclusions and explicit unknowns. Do not copy lengthy issuer marketing material or upload copyrighted PDFs. Benefit descriptions and calculation adapters are separate; selecting a known identity does not imply verified calculation support.

By contributing, you agree that your contribution is distributed under the repository's MIT licence. Security concerns should follow SECURITY.md instead of a public bug report.
