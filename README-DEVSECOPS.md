# Smart Helpdesk Ticket System — DevSecOps integrated repository

This repository combines the upstream Smart Helpdesk application with a DevSecOps learning/deployment overlay.

## Application (verified from source tree)
- Backend: FastAPI at repository root (`main.py`, `api/`, `services/`, `models/`)
- Frontend: Next.js in `frontend/`
- Database: PostgreSQL with Alembic migrations
- Docker Compose: root `docker-compose.yml`
- Application ports: UI `3000`, API `8000`, PostgreSQL `5432`

## Start the application locally (Windows / Docker Desktop)

1. Install Docker Desktop and start it.
2. In PowerShell, from this repository folder:
   ```powershell
   Copy-Item .env.example .env
   ```
3. Edit `.env` and set a strong `SECRET_KEY`. For Docker Compose, set:
   ```dotenv
   DATABASE_URL=postgresql+psycopg2://postgres:YOUR_DB_PASSWORD@db:5432/helpdesk
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=YOUR_DB_PASSWORD
   POSTGRES_DB=helpdesk
   SECRET_KEY=replace-with-a-long-random-secret
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=120
   ```
   Compose has defaults for local practice, but replace them before sharing or deploying.
4. Build and start:
   ```powershell
   docker compose up --build -d
   docker compose ps
   ```
5. Open:
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - Swagger: http://localhost:8000/docs
6. Stop:
   ```powershell
   docker compose down
   ```
   To also erase the local database volume (destructive):
   ```powershell
   docker compose down -v
   ```

## DevSecOps workflow

The root `Jenkinsfile` is adapted to the actual layout:
- Gitleaks secret scan
- Python dependency install and compile validation (there is no `tests/` directory in the supplied upstream snapshot)
- Frontend `npm ci`, lint, and production build
- SonarQube analysis and quality gate
- OWASP Dependency-Check
- Trivy filesystem and Docker image scans
- Docker image build; push is gated to `main` and uses Jenkins credential `registry-credentials`

### Jenkins agent requirements
Jenkins must run on a Linux agent with Docker CLI + Docker daemon access, Python 3, Node/npm, Gitleaks, Trivy, Sonar Scanner, and the Jenkins Dependency-Check plugin/tool configured. Configure Jenkins tools and SonarQube server name exactly as referenced (`SonarQube`, `Dependency-Check`). Configure registry credentials in Jenkins; never put tokens in this repository. A stock Jenkins container does not automatically have Docker daemon access—use a properly configured Docker-capable agent.

### Start optional Jenkins and SonarQube services
```powershell
docker compose -f compose.devsecops.yml up -d
```
- Jenkins: http://localhost:8081
- SonarQube: http://localhost:9000

The Compose file is a local practice stack, not a hardened production deployment. Configure Jenkins agent/tooling and SonarQube credentials manually.

## Kubernetes / Helm / Argo CD
- `k8s/`: manifests (review image names, namespace, secrets and app settings before apply)
- `helm/smart-helpdesk/`: Helm chart starter
- `argocd/application.yaml`: GitOps Application starter; replace the repository URL with your own Git repo

The chart currently expects registry images and Kubernetes secrets to be configured. Do not apply with placeholder registry values or absent DB/JWT secrets. Start with local Docker Compose, then follow `docs/KUBERNETES.md` and `docs/PIPELINE.md`.

## Monitoring
`monitoring/` contains a Prometheus starter. The upstream API does not currently include a Prometheus `/metrics` endpoint, so application metrics scraping requires adding instrumentation or deploying a compatible exporter. Prometheus/Grafana are optional for the local application demo.

## Safety / known gaps
- The supplied upstream source snapshot has no backend `tests/` directory; pipeline currently runs compile validation and reports that tests are absent.
- CI tools and Jenkins credentials must be installed/configured on the Jenkins agent; they are not bundled inside the application image.
- Kubernetes/Helm/Argo CD manifests are starters and need repository/image/secrets review before use.
- Do not commit `.env`, registry credentials, Sonar tokens, kubeconfig, or private keys.
