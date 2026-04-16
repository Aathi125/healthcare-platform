# Client (single dev server)

All frontends run from **`client/`** on **one host and port** (default `http://127.0.0.1:3000`).

The hub, auth, and consult pages share a **Mayo Clinic–inspired** shell: white top navigation with dropdowns, utility links (Request appointment, Register / Log in, search), a full-width **hero** on the home page (serif headline, ghost CTA, optional play control), and a **Feedback** tab. Branding is generic (**Care Platform**) — not affiliated with any real health system.

| Page | URL | App |
|------|-----|-----|
| Hub | `/` | Links to auth + consult |
| Auth (VitaGate) | `/auth.html` | `auth-frontend/src` |
| Video (PulseRoom) | `/consult.html` | `telemedicine-frontend/src` |

## Run

From **`client/`** (not the subfolders):

```bash
cd client
npm install
npm run dev
```

Open the URL Vite prints (usually `http://127.0.0.1:3000/`). Use the hub or go directly to `/auth.html` or `/consult.html`.

## Optional: subfolders alone

You can still run `npm run dev` inside `auth-frontend` or `telemedicine-frontend` for an isolated server, but the recommended flow is the unified **`client/`** server above.

## Backends

- `auth-service` → `http://127.0.0.1:8081` (proxied as `/api/auth`)
- `telemedicine-service` → `http://127.0.0.1:4007` (proxied as `/api/v1/video`)
