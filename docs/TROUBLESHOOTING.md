# Troubleshooting

## Docker Compose
```powershell
docker compose ps
docker compose logs --tail=150
docker compose down
```
Check port collisions and `.env` values. Do not remove volumes unless you accept data loss.

## Jenkins can't use Docker
A Jenkins container does not automatically have access to Docker Desktop. Use a Docker-capable agent
or a carefully configured local socket. Never expose an unauthenticated Docker daemon.

## SonarQube won't start
SonarQube requires sufficient memory and compatible host settings. Check:
```powershell
docker compose -f compose.devsecops.yml logs sonarqube
```
Wait for its healthcheck before running scanner.

## Kubernetes image pull errors
- Verify image repository/tag.
- If using a private registry, create imagePullSecret.
- Docker Desktop Kubernetes may use local images depending on image policy; prefer a registry for predictable pulls.

## CrashLoopBackOff
```powershell
kubectl describe pod -n helpdesk <pod>
kubectl logs -n helpdesk <pod> --previous
```
Check DB URL, migrations, ports, and health probe path.

## No application metrics
Kubernetes metrics do not automatically include application business metrics. Add an instrumented
metrics endpoint or use only cluster-level metrics in the demo.
