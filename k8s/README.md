# Kubernetes Deployment Notes

This project now uses MongoDB Atlas for all application data stores. The `mongo-deployment.yaml`, `mongo-service.yaml`, and `mongo-pvc.yaml` files are legacy artifacts and are not required for the current Atlas-based setup.

## Required manifests

Backend:

- `app-secret.yaml`
- `auth-deployment.yaml`
- `auth-service.yaml`
- `doctor-deployment.yaml`
- `doctor-service.yaml`
- `appointment-deployment.yaml`
- `appointment-service.yaml`
- `patient-deployment.yaml`
- `patient-service.yaml`
- `payment-deployment.yaml`
- `payment-service.yaml`
- `notification-deployment.yaml`
- `notification-service.yaml`
- `gateway-deployment.yaml`
- `gateway-service.yaml`

Frontend:

- `frontend-deployment.yaml`
- `frontend-service.yaml`

## Before applying

1. Build and push every image referenced by the deployment manifests.
2. Update image names and tags in all deployment files.
3. Keep `JWT_SECRET` aligned with every JWT-validating service.
4. Set browser-reachable public URLs in:
   - `k8s/frontend-deployment.yaml`
   - `k8s/payment-deployment.yaml`
5. Keep the gateway reachable from the frontend on port `4000`.
6. Confirm each service manifest still points to the correct Atlas database.

## Apply order

```bash
kubectl apply -f k8s/app-secret.yaml

kubectl apply -f k8s/auth-deployment.yaml
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/doctor-deployment.yaml
kubectl apply -f k8s/doctor-service.yaml
kubectl apply -f k8s/appointment-deployment.yaml
kubectl apply -f k8s/appointment-service.yaml
kubectl apply -f k8s/patient-deployment.yaml
kubectl apply -f k8s/patient-service.yaml
kubectl apply -f k8s/payment-deployment.yaml
kubectl apply -f k8s/payment-service.yaml
kubectl apply -f k8s/notification-deployment.yaml
kubectl apply -f k8s/notification-service.yaml
kubectl apply -f k8s/gateway-deployment.yaml
kubectl apply -f k8s/gateway-service.yaml

kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

## Verify

```bash
kubectl get pods
kubectl get svc
kubectl describe deployment gateway
```

## Notes

- the frontend should call the gateway, not individual services
- service-to-service communication should remain on ports `4001` to `4006`
- if Stripe Checkout is used, ensure the payment webhook public URL forwards to `/payments/webhook`
