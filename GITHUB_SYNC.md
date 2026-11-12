# GitHub collaboration and sync guide

Repository: `https://github.com/globalsouthaipolicycoalition/bangladesh-ai-governance-phase1`

## Clone

```bash
git clone https://github.com/globalsouthaipolicycoalition/bangladesh-ai-governance-phase1.git
cd bangladesh-ai-governance-phase1
```

## Sync the latest changes

```bash
git checkout main
git pull --ff-only origin main
```

## Contribute from another GitHub account

Fork the repository, clone the fork, create a feature branch, commit changes, push the branch to the fork, and open a pull request against `main` in the upstream repository. Do not commit `.env` files, credentials, database URLs, OAuth secrets, storage keys, or other protected values.

```bash
git checkout -b feature/your-change
git add .
git commit -m "Describe the change"
git push -u origin feature/your-change
```

The repository is intentionally public for now. Before production deployment, move secrets to protected environment variables and review whether the repository should become private.
