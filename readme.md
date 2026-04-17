# Smart Healthcare Platform

A university telemedicine platform built with **Node.js**, **React**, **MongoDB Atlas**, **Docker Compose**, and **Kubernetes**. The system supports the full healthcare workflow across cleanly separated microservices.

---

## Features

- Patient registration, login, and profile management
- Doctor account creation, profile setup, verification, and availability management
- Doctor browsing and search by specialization
- Appointment booking, modification, cancellation, acceptance, rejection, and completion
- Payments restricted to accepted or completed appointments
- Medical reports, prescriptions, notifications, and Jitsi video consultation links

---

## Architecture

### Services

| Component | Port | Database | Purpose |
|---|---|---|---|
| Frontend | `5173` | — | React app for patient, doctor, and admin flows |
| Gateway | `4000` | — | Single API entry point and reverse proxy |
| Auth Service | `4001` | `auth-db` | JWT auth, patient registration, doctor/admin account creation |
| Doctor Service | `4002` | `doctor-db` | Doctor profiles, specializations, availability, verification |
| Appointment Service | `4003` | `appointment-db` | Slots, bookings, appointment lifecycle, Jitsi meeting links |
| Patient Service | `4004` | `patient-db` | Patient profiles, reports, prescriptions |
| Payment Service | `4005` | `payment-db` | Mock payment records and Stripe Checkout integration |
| Notification Service | `4006` | — | Email notifications via SMTP or JSON transport fallback |

### MongoDB Atlas

```
mongodb+srv://teacups:teacups@teacups.cajbnbv.mongodb.net/
```

Each service uses its own database: `auth-db`, `doctor-db`, `appointment-db`, `patient-db`, `payment-db`.

### API Gateway

All client-facing requests go through:

```
http://localhost:4000
```

Route prefixes: `/auth` · `/doctors` · `/appointments` · `/patients` · `/payments` · `/notifications`

### Authentication

- JWT header: `Authorization: Bearer <token>`
- Roles: `PATIENT`, `DOCTOR`, `ADMIN`

---

## Project Structure

```
frontend/
gateway/
services/
  auth-service/
  doctor-service/
  appointment-service/
  patient-service/
  payment-service/
  notification-service/
k8s/
docker-compose.yml
seed-doctors.js
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Docker Desktop (for Compose)
- `kubectl` (for Kubernetes)
- Internet access to reach MongoDB Atlas

### Install Dependencies

Run from the project root:

```bash
npm install
npm install --prefix gateway
npm install --prefix services/auth-service
npm install --prefix services/doctor-service
npm install --prefix services/appointment-service
npm install --prefix services/patient-service
npm install --prefix services/payment-service
npm install --prefix services/notification-service
npm install --prefix frontend
```

> The root `npm install` is for `seed-doctors.js`. Each service and the frontend have their own `package.json`.

---

## Running the Platform

### Option 1 — Docker Compose (recommended)

```bash
docker compose up --build
```

Other useful Compose commands:

```bash
docker compose up --build -d   # detached mode
docker compose logs -f          # follow logs
docker compose down             # stop everything
docker compose config           # validate config
```

After startup, visit:
- Frontend: `http://localhost:5173`
- Gateway API: `http://localhost:4000`

### Option 2 — Individual terminals

Open one terminal per service and run from the project root:

```bash
npm run dev --prefix gateway
npm run dev --prefix services/auth-service
npm run dev --prefix services/doctor-service
npm run dev --prefix services/appointment-service
npm run dev --prefix services/patient-service
npm run dev --prefix services/payment-service
npm run dev --prefix services/notification-service
npm run dev --prefix frontend
```

### Service Command Reference

| Component | Dev | Production |
|---|---|---|
| Gateway | `npm run dev --prefix gateway` | `npm run start --prefix gateway` |
| Auth Service | `npm run dev --prefix services/auth-service` | `npm run start --prefix services/auth-service` |
| Doctor Service | `npm run dev --prefix services/doctor-service` | `npm run start --prefix services/doctor-service` |
| Appointment Service | `npm run dev --prefix services/appointment-service` | `npm run start --prefix services/appointment-service` |
| Patient Service | `npm run dev --prefix services/patient-service` | `npm run start --prefix services/patient-service` |
| Payment Service | `npm run dev --prefix services/payment-service` | `npm run start --prefix services/payment-service` |
| Notification Service | `npm run dev --prefix services/notification-service` | `npm run start --prefix services/notification-service` |
| Frontend | `npm run dev --prefix frontend` | `npm run preview --prefix frontend` |

### Seed Demo Data

```bash
node seed-doctors.js
```

**Demo credentials:**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@hospital.com` | `admin123` |
| Doctors | *(seeded emails)* | `password123` |
| Patients | Register via `/auth/register` | — |

---

## API Reference

All paths are relative to `http://localhost:4000`.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a patient account |
| `POST` | `/auth/login` | Public | Login and receive a JWT |
| `GET` | `/auth/me` | Any role | Get current user profile |
| `POST` | `/auth/create-doctor` | `ADMIN` | Create a doctor login account |
| `POST` | `/auth/create-admin` | Public | Create an admin account |
| `GET` | `/auth/doctor-accounts` | `ADMIN` | List all doctor accounts |

### Doctors

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/doctors` | Public | List doctors (optional `?specialization=`) |
| `GET` | `/doctors/:id` | Public | Get a doctor profile |
| `GET` | `/doctors/me/profile` | `DOCTOR` | Get own profile |
| `PUT` | `/doctors/me/profile` | `DOCTOR` | Update own profile |
| `POST` | `/doctors/me/availability` | `DOCTOR` | Set availability |
| `POST` | `/doctors` | `ADMIN` | Create a doctor profile |
| `PATCH` | `/doctors/:id/verify` | `ADMIN` | Verify or unverify a doctor |

### Appointments

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/appointments/available-slots` | `PATIENT` | Get available slots for a doctor and date |
| `POST` | `/appointments` | `PATIENT` | Book an appointment |
| `GET` | `/appointments/my` | `PATIENT` | List own appointments |
| `PUT` | `/appointments/my/:id` | `PATIENT` | Edit a pending appointment |
| `PATCH` | `/appointments/my/:id/cancel` | `PATIENT` | Cancel an appointment |
| `GET` | `/appointments/doctor` | `DOCTOR` | List doctor's appointments |
| `PATCH` | `/appointments/doctor/:id/accept` | `DOCTOR` | Accept an appointment (generates Jitsi link) |
| `PATCH` | `/appointments/doctor/:id/reject` | `DOCTOR` | Reject an appointment |
| `PATCH` | `/appointments/doctor/:id/complete` | `DOCTOR` | Mark appointment as completed |

**Status values:** `PENDING` · `ACCEPTED` · `REJECTED` · `CANCELLED` · `COMPLETED`

### Patients

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/patients/me/profile` | `PATIENT` | Get own profile (auto-created on first access) |
| `PUT` | `/patients/me/profile` | `PATIENT` | Update own profile |
| `POST` | `/patients/me/reports` | `PATIENT` | Upload a medical report |
| `GET` | `/patients/me/reports` | `PATIENT` | List own reports |
| `GET` | `/patients/:patientId/reports` | `DOCTOR`, `ADMIN` | View a patient's reports |
| `GET` | `/patients/reports/:reportId/download` | Any auth | Download a report file |
| `POST` | `/patients/doctor/prescriptions` | `DOCTOR` | Issue a prescription |
| `GET` | `/patients/me/prescriptions` | `PATIENT` | View own prescriptions |

### Payments

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/payments/pay` | `PATIENT` | Mock payment for an appointment |
| `POST` | `/payments/checkout-session` | `PATIENT` | Create a Stripe Checkout session |
| `GET` | `/payments/checkout-session/:sessionId` | `PATIENT` | Check Stripe session status |
| `GET` | `/payments/my` | `PATIENT` | List own payments |
| `GET` | `/payments` | `ADMIN` | List all payments |
| `GET` | `/payments/appointment/:appointmentId` | Any auth | Get payment for a specific appointment |

**Status values:** `PENDING` · `PAID` · `FAILED`

> Payment is only allowed when the appointment status is `ACCEPTED` or `COMPLETED`.

### Notifications

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/notifications/email` | Public | Send an email notification |

---

## Smoke Test Walkthrough

### 1. Create admin and login

```bash
curl -X POST http://localhost:4000/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{ "name": "Admin User", "email": "admin@hospital.com", "password": "admin123" }'

curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "admin@hospital.com", "password": "admin123" }'
```

### 2. Register a patient

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{ "name": "Patient One", "email": "patient1@example.com", "password": "patient123" }'
```

### 3. Seed doctors

```bash
node seed-doctors.js
```

### 4. Browse doctors

```bash
curl http://localhost:4000/doctors
curl "http://localhost:4000/doctors?specialization=Cardiology"
```

### 5. Check available slots

```bash
curl "http://localhost:4000/appointments/available-slots?doctorProfileId=<DOCTOR_PROFILE_ID>&appointmentDate=2026-04-20" \
  -H "Authorization: Bearer <PATIENT_TOKEN>"
```

### 6. Book an appointment

```bash
curl -X POST http://localhost:4000/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <PATIENT_TOKEN>" \
  -d '{
    "doctorProfileId": "<DOCTOR_PROFILE_ID>",
    "reason": "Follow-up consultation",
    "appointmentDate": "2026-04-20",
    "timeSlot": "09:00 AM"
  }'
```

### 7. Doctor accepts the appointment

```bash
curl -X PATCH http://localhost:4000/appointments/doctor/<APPOINTMENT_ID>/accept \
  -H "Authorization: Bearer <DOCTOR_TOKEN>"
```

### 8. Patient pays

```bash
curl -X POST http://localhost:4000/payments/pay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <PATIENT_TOKEN>" \
  -d '{ "appointmentId": "<APPOINTMENT_ID>", "amount": 5000, "method": "MOCK_CARD" }'
```

### 9. Check reports and prescriptions

```bash
curl http://localhost:4000/patients/me/reports -H "Authorization: Bearer <PATIENT_TOKEN>"
curl http://localhost:4000/patients/me/prescriptions -H "Authorization: Bearer <PATIENT_TOKEN>"
```

---

## Health Checks

```bash
curl http://localhost:4000/   # Gateway
curl http://localhost:4001/   # Auth
curl http://localhost:4002/   # Doctor
curl http://localhost:4003/   # Appointment
curl http://localhost:4004/   # Patient
curl http://localhost:4005/   # Payment
curl http://localhost:4006/   # Notification
```

---

## Kubernetes Deployment

Manifests are in the `k8s/` directory. Apply in order:

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

Verify deployment:

```bash
kubectl get pods
kubectl get svc
kubectl describe deployment gateway
```

**Deployment checklist:**
- Update image names before applying
- Keep `JWT_SECRET` identical across all services
- Set browser-reachable public URLs in `frontend-deployment.yaml`
- Ensure the gateway is reachable from the frontend at port `4000`

---

## Environment Notes

- Each service's `.env` file already points to the Atlas cluster and the correct port
- Keep `JWT_SECRET` the same across all services that validate tokens
- Frontend should set `VITE_API_BASE_URL=http://localhost:4000`
- For Stripe: set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `services/payment-service/.env`
- If SMTP credentials are missing, the notification service falls back to JSON transport
- **Do not commit live secrets to version control**

---

## Workflow Notes

- Patient self-registration creates `PATIENT` accounts only
- Admin creates doctor login accounts via `auth-service`, then doctor profiles via `doctor-service`
- Admin must verify doctors before they appear as active
- Appointment booking requires the **doctor profile ID**, not the auth user ID
- Accepted appointments automatically receive a Jitsi `meetingLink`
- Prescriptions can be linked to an accepted or completed appointment (optional)
