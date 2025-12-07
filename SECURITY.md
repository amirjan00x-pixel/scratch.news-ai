# Security Guidelines

## Secrets management
- Never commit `.env`, `server/.env`, or any other file containing real credentials. Local secrets must only live in files created from `.env.example` or `server/.env.example`.
- Rotate Supabase and Hugging Face keys any time you believe they may have been exposed (especially if they were previously stored in Git history).
- Configure CI/CD platforms to inject secrets via environment variables instead of files in the repository.

## Reporting vulnerabilities
If you discover a security issue inside this project, please open a private channel (email or direct message) with the maintainers instead of filing a public issue. Provide as much detail as possible so we can reproduce and patch quickly.
