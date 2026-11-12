# Upstream repository reconnaissance (required)

Before wiring CI/CD, inspect the actual upstream repo. Do not assume README claims imply
all features or scripts exist.

```powershell
# List top-level files
Get-ChildItem -Force

# Find package/build manifests
Get-ChildItem -Recurse -File -Include package.json,pyproject.toml,requirements.txt,poetry.lock,pnpm-lock.yaml,package-lock.json,yarn.lock,Dockerfile,docker-compose.yml,compose.yml

# Inspect scripts
Get-Content .\frontend\package.json
Get-Content .\backend\pyproject.toml
```

Adjust paths above to the real layout. Record:
- frontend folder and package manager
- frontend lint/test/build commands
- backend folder, Python version, dependency manager
- backend test command
- Docker image names and exposed ports
- API health endpoint
- DB migration command
- required environment variables (names only; no values/secrets)

If the app has no automated tests, add smoke tests before making the pipeline gate deployments.
