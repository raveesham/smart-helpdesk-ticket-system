# Build from scratch on Windows 10/11

## Prerequisites
Install:
1. Git for Windows
2. Docker Desktop (enable WSL2 backend; enable Kubernetes later)
3. VS Code
4. Python only if you will run backend outside Docker
5. Node.js only if you will run frontend outside Docker

Use PowerShell.

## Phase 1 — Get the application
```powershell
git clone https://github.com/SMNpuneeth/Smart-Helpdesk-Ticket-System.git
cd Smart-Helpdesk-Ticket-System
```
Copy this integration kit into the repository root. Do not overwrite the upstream README,
compose file, or app Dockerfiles without reviewing them.

## Phase 2 — Inspect and configure
Read upstream README. Locate its compose file and `.env.example`.
```powershell
Get-ChildItem -Force
Get-ChildItem -Recurse -File -Include *env*,compose*.yml,docker-compose.yml
```
Create `.env` from the upstream example. Set local development values only. Never commit `.env`.
```powershell
Copy-Item .env.example .env
```
If upstream uses a different env example, use that file.

## Phase 3 — Run upstream app first
Use the exact upstream compose command:
```powershell
docker compose up --build
```
If compose has a different filename:
```powershell
docker compose -f <upstream-compose-file> up --build
```
Check:
```powershell
docker compose ps
docker compose logs --tail=100
```
Open the frontend URL and API docs URL specified by upstream README. Validate:
- login for each role
- create ticket
- assign technician
- status transition
- comment/history
- dashboard/report
- database persistence after restart

Stop:
```powershell
docker compose down
```
Keep DB volume unless you intentionally want to reset demo data.

## Phase 4 — Validate the integration kit
```powershell
docker compose -f compose.devsecops.yml config
```
This compose file is an optional local tool stack; it does not replace upstream app compose.
Run Jenkins/SonarQube separately from app compose to avoid port conflicts.

## Phase 5 — Git
```powershell
git status
git add .
git commit -m "Add DevSecOps integration files"
git push
```
Before committing, ensure `.env`, credentials, tokens, and database dumps are ignored.
