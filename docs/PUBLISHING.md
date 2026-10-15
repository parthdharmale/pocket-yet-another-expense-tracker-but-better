# Publishing this source

This directory is a sanitised source snapshot with no old Git history. Publish this directory only. Do not copy `.git`, `.env*`, `.vercel`, `.pocket-*`, outputs, recordings, PDFs, private backups or screenshots from another installation.

Before pushing:

1. Review LICENSE, THIRD_PARTY_NOTICES.md, README and SECURITY.md.
2. Initialise a new Git repository in this directory, not a personal workspace containing unrelated projects. Run `npm run setup` to enable the local hooks. It preserves existing configuration.
3. Run `npm run check` and `npm run build`. No real credentials are needed for tests/build.
4. Run `git status --short --untracked-files=all` and inspect the exact staged diff before pushing. `.env.local` and `.pocket-access.txt` must remain ignored.
5. Create your GitHub repository, connect its remote, and publish the sanitised source. Enable private vulnerability reporting, available secret scanning/push protection, and branch protection requiring the Check public source workflow.
6. If you deploy this fork, configure your own project, private Blob store and server-side keys. Never connect an arbitrary fork to someone else's live app.

Local secret scanning cannot prove no secret exists in every possible form. If one is exposed, revoke it even if the file is removed later. A fresh public history avoids publishing previous private history, but does not revoke anything that may already have leaked elsewhere.
