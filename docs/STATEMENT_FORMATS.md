# Statement formats and interpretation

Currently supported: text-based HDFC monthly, HDFC annual-summary, and HSBC monthly statement layouts exercised by synthetic regression tests. Bank layout changes may require parser updates. Scanned/image-only statements and arbitrary bank PDFs are not supported. Imports are owner-only, at most 4 MB and 30 pages per PDF; PDF passwords are used to read the upload and are not saved with the workspace. Original PDFs are not stored.

Transactions retain statement dates, debit/credit kind, merchant description, card identity and source associations. Upload dates do not determine the spending month. Deduplication prevents repeated source imports from inflating totals; annual/monthly cross-layout overlap is blocked rather than guessed.

Purchases minus refunds form net spending. Repayments, cashback, fees and interest are separate. Partial statement coverage is labelled; missing periods are not assumed to contain zero spending. Projections/scenarios are estimates. Manual merchant confirmation and amount labels do not establish what item was purchased. Optional online business research sends a merchant name to OpenAI web search; individual payees are excluded.

See the fictional examples and parser tests. Report unsupported layouts using invented/anonymised structural examples, never your actual statement or account number in a public issue.
