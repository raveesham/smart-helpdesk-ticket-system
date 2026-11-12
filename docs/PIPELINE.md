# CI/CD pipeline integration

## Pipeline stages
1. Checkout
2. Secret scan (Gitleaks)
3. Frontend dependency install, lint, test, build (adapt to package scripts)
4. Backend dependency install, lint/test (adapt to Python manager)
5. SonarQube analysis
6. OWASP Dependency-Check
7. Trivy filesystem scan
8. Build frontend/backend Docker images
9. Trivy image scan
10. Push only when credentials and registry are configured
11. Deploy via Helm only from a trusted branch and after all gates pass

## Jenkins setup
- Install Pipeline, Git, Docker Pipeline, SonarQube Scanner, Credentials Binding plugins.
- Configure tools: JDK if required, Node only if Jenkins runs frontend commands, Python if backend commands run on agent.
- Configure SonarQube server in Manage Jenkins → System.
- Add credentials:
  - `sonar-token` (Secret text)
  - `registry-credentials` (username/password)
  - optional `kubeconfig` (Secret file; local demo can use Docker Desktop context instead)
- Use a Docker-capable Jenkins agent. Docker Desktop host socket access from a Jenkins container is platform-specific;
  do not mount the host Docker socket in shared/untrusted environments.

## Pipeline adaptation
Open `Jenkinsfile`. Set:
- `FRONTEND_DIR`
- `BACKEND_DIR`
- `FRONTEND_IMAGE`
- `BACKEND_IMAGE`
- `REGISTRY`
- frontend commands and backend test command

The default commands are intentionally conservative and may need changing. The pipeline should fail clearly
rather than pretend a missing script passed.

## Quality/security gates
- SonarQube: configure project key and token.
- Dependency-Check: update database may take several minutes on first run.
- Trivy: filesystem and image scan.
- Gitleaks: scans history/files for committed secrets.
- Fix findings before release; don't disable scans just to obtain green output.

## Registry
For local-only deployment, images may be built locally and loaded into Docker Desktop Kubernetes.
For Kubernetes image pull, use a registry such as Docker Hub; create a token, store it in Jenkins credentials,
and never paste it into Jenkinsfile or Git.
