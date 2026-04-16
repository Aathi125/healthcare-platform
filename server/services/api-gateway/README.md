# API Gateway

Single entry point for all healthcare platform services. This gateway forwards incoming API requests to downstream services based on path prefixes.

## Port

- Configured with `PORT` in `.env` (see `.env.example`).
- If `curl http://localhost:8080/health` returns **Apache Tomcat** HTML, **nothing is wrong with the gateway** — another process owns `8080`. Either stop that process or set `PORT` (for example `8090`), restart the gateway, and call `http://localhost:<PORT>/health`.

## Route Map

- `/api/auth/*` -> auth-service
- `/api/doctors/*` -> doctor-service
- `/api/appointments/*` -> appointment-service
- `/api/patients/*` -> patient-service
- `/api/v1/patient/*` -> patient-service
- `/api/patient/*` -> patient-service (backward compatibility)
- `/api/payments/*` -> payment-service
- `/api/notifications/*` -> notification-service
- `/api/telemedicine/*` -> telemedicine-service
- `/api/ai/*` -> ai-symptom-service

## Default Service URLs

These are the current team-aligned defaults used by `.env.example`:

- `AUTH_SERVICE_URL=http://localhost:8081`
- `DOCTOR_SERVICE_URL=http://localhost:5002`
- `APPOINTMENT_SERVICE_URL=http://localhost:5003`
- `PATIENT_SERVICE_URL=http://localhost:8084`
- `PAYMENT_SERVICE_URL=http://localhost:8085`
- `NOTIFICATION_SERVICE_URL=http://localhost:8086`
- `TELEMEDICINE_SERVICE_URL=http://localhost:4007`
- `AI_SYMPTOM_SERVICE_URL=http://localhost:8088`

## Setup

1. Copy `.env.example` to `.env`.
2. Adjust downstream service URLs only if teammate ports/hosts differ in your local setup.
3. Install dependencies:
   - `npm install`
4. Start gateway:
   - `npm start`

## Quick Check

- Health endpoint: `GET http://localhost:<PORT>/health` (default in `.env.example` is `8090` if you copied it)
- Example proxy check (auth health): `GET http://localhost:<PORT>/api/auth/health`
