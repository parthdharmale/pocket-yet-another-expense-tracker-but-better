# Security

Never post real statements, account details, financial exports, recordings, API keys, shortcut tokens, password hashes or session secrets in an issue or pull request.

If the repository offers GitHub's **Report a vulnerability** option, use it for private disclosure. The repository owner should enable private vulnerability reporting before publishing. If no private channel exists, open a minimal issue asking the maintainer to establish one without including exploit details or sensitive data. Do not test vulnerabilities against another operator's hosted instance without permission.

## Secrets and publishing

`.env.local`, `.env.*`, `.pocket-*`, `.vercel/`, backups and output/media directories are ignored. Only `.env.example` with empty secret values is intended for Git. Setup installs local pre-commit/pre-push checks; CI repeats the scan. Hooks can be bypassed, so also enable GitHub secret scanning/push protection where available. The built-in scan recognises common secret formats and exact local secret values; it cannot detect every arbitrary credential.

If a real credential reaches Git, revoke/rotate it immediately. Deleting a file in a later commit does not remove it from history, forks or clones. Rotate exposed session secrets/passwords and shortcut tokens too, then assess history cleanup. Never commit another operator's old Git history into a fresh public copy.

## Deployment boundaries

Use your own dedicated private Blob store, keys and Vercel project. Never expose server credentials through NEXT_PUBLIC_* variables. The owner and hosting operator can access hosted data at infrastructure level. Invite-only access is not email ownership verification. Self-host only for people who understand and accept the operator's access.

Use HTTPS in production, keep dependencies current, retain authentication/origin checks and quotas, and do not grant untrusted CI jobs production credentials. AI features transmit the relevant description/audio/merchant name to the configured provider. Runtime secrets and spending limits must be managed in provider/hosting settings.
