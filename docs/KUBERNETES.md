# Local Kubernetes deployment

## 1. Enable Docker Desktop Kubernetes
Docker Desktop → Settings → Kubernetes → Enable Kubernetes → Apply & Restart.
Check:
```powershell
kubectl config current-context
kubectl get nodes
```
Expected context is commonly `docker-desktop`; node should be Ready.

## 2. Review manifests
Update `k8s/` and Helm values:
- image repository and tag
- container ports (match upstream)
- API/frontend environment variables
- database connection secret
- health/readiness endpoint paths
- persistent volume storage class if needed

Do not use sample credentials in a shared cluster. The chart includes demo placeholders.

## 3. Deploy raw manifests (optional)
```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -n helpdesk -f k8s/
kubectl get pods -n helpdesk
kubectl get svc -n helpdesk
```
If the manifests use placeholder images, replace them first.

## 4. Deploy with Helm
```powershell
helm lint .\helm\smart-helpdesk
helm template smart-helpdesk .\helm\smart-helpdesk -n helpdesk
helm upgrade --install smart-helpdesk .\helm\smart-helpdesk --namespace helpdesk --create-namespace
kubectl rollout status deployment -n helpdesk
```
Use `kubectl port-forward` for local access:
```powershell
kubectl port-forward -n helpdesk svc/helpdesk-frontend 3000:3000
kubectl port-forward -n helpdesk svc/helpdesk-backend 8000:8000
```
Ports must match the chart values and upstream app.

## 5. Argo CD
Install Argo CD on Docker Desktop Kubernetes using its official install instructions. Apply
`argocd/application.yaml` after updating the Git repository URL and path. Argo CD must be able
to access the repo (public or configured credentials). Sync only after the chart renders successfully.

## Rollback
```powershell
helm history smart-helpdesk -n helpdesk
helm rollback smart-helpdesk <REVISION> -n helpdesk
```
