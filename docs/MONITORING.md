# Prometheus and Grafana

The starter config scrapes Kubernetes and an application metrics endpoint. The application must
actually expose Prometheus metrics for app-level metrics; otherwise only Kubernetes/container
metrics can be shown.

## Install
Use Helm for Prometheus/Grafana or the upstream kube-prometheus-stack chart. For a lightweight
local demo, install separately and configure Prometheus using `monitoring/prometheus.yml`.

## Verify
```powershell
kubectl get pods -A
kubectl port-forward -n monitoring svc/prometheus 9090:9090
kubectl port-forward -n monitoring svc/grafana 3000:80
```
Service names vary by chart release. Check `kubectl get svc -n monitoring`.

## Dashboard
Create a dashboard showing:
- pod CPU and memory
- pod restarts
- deployment replicas/availability
- HTTP request count/latency only if application metrics are exposed
- Prometheus target health

Do not claim ticket count or API latency metrics unless the application exports them.
