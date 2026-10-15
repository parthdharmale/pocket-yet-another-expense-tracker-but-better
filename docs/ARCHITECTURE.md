# Architecture

Next.js App Router serves the password/invite-only application and authenticated route handlers. React client components never receive provider credentials. The public `/demo` uses invented local state and does not call paid AI entry/transcription routes.

- `lib/auth`: scrypt password verification, signed HttpOnly sessions, invite-only directory, throttling and role checks.
- `lib/pocket`: integer-paise calculations, card/rule catalogue adapters, calendar, refunds/splits, storage and entry-date validation.
- `lib/shortcut`: scoped bearer tokens, natural-language entry preparation, replay protection and undo.
- `lib/statements`: PDF text extraction, HDFC/HSBC parsers, import deduplication, categories, optional merchant research, coverage-aware insights and custom amount labels.
- `lib/ai`: structured entry extraction, multilingual transcription and request quotas. Models/keys are server-side configuration.
- `lib/analytics`: anonymised visitor/demo counters exposed through owner administration.

All ledgers are private Blob snapshots partitioned by authenticated server account ID; callers cannot choose another account by sending an email/owner field. Writes are versioned and conditional on the current ETag. Concurrent changes fail rather than overwrite. Prior-ledger recovery keeps one private snapshot. Statement imports use a separate owner-only workspace and never inflate leisure entries.

Development/preview uses `pocket/development`; production uses `pocket/production`. Use dedicated storage per deployment/operator. The JSON adapter is intentionally limited to small groups; a larger release needs a transactional database migration and pagination.

The public source starts new owners and members empty. Legacy migration code remains for reward snapshots; synthetic reward regression configurations live only under tests/fixtures. Hosted operator credentials and existing user records are not part of this repository.
