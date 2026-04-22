# Doctor Setup Guide

## Issue Identified
The doctors are not being fetched for booking appointments and in the search bar because **there are no doctors in the database**. The system requires a two-step process to create doctors:

1. Create a doctor account in the auth service
2. Create a doctor profile linked to that user ID

## Solution

### Option 1: Use the Admin Panel (Recommended)
1. Navigate to `http://localhost:5173` 
2. Register/login as an admin (use admin@hospital.com / admin123)
3. Go to Admin Dashboard
4. Use "Create Doctor Account" to create the auth account
5. Use "Create Doctor Profile" to create the profile with the user ID from step 4

### Option 2: Use the Seeding Script
Run the seeding script to populate the database with sample doctors:

```bash
cd "\Users\aathi\OneDrive\Documents\Aathika\My_Projects\Smart_Healthcare\Smart_Healthcare"
npm install axios
node seed-doctors.js
```

This will create:
- 1 Admin account (admin@hospital.com / admin123)
- 5 Sample doctors across different specializations

### Option 3: Manual API Creation
1. Create admin account:
```bash
curl -X POST http://localhost:4000/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"name": "Admin User", "email": "admin@hospital.com", "password": "admin123"}'
```

2. Login as admin to get token:
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@hospital.com", "password": "admin123"}'
```

3. Create doctor account using the token:
```bash
curl -X POST http://localhost:4000/auth/create-doctor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Dr. Name", "email": "doctor@hospital.com", "password": "password123"}'
```

4. Create doctor profile using the user ID:
```bash
curl -X POST http://localhost:4000/doctors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "USER_ID_FROM_STEP_3",
    "name": "Dr. Name",
    "email": "doctor@hospital.com",
    "specialization": "Cardiology",
    "experience": 10,
    "hospital": "Hospital Name",
    "consultationFee": 5000,
    "availability": [
      {"day": "Monday", "slots": ["09:00 AM", "10:00 AM"]}
    ]
  }'
```

## Verification
After creating doctors, you can verify they're being fetched correctly:

```bash
curl http://localhost:4000/doctors
```

The frontend should now show doctors in:
- The main Doctors page with search functionality
- The Book Appointment dropdown

## Troubleshooting Common Errors

### `401 Unauthorized` on `POST /auth/login`
This means the email/password pair is invalid for that account type.

Checklist:
- Make sure the doctor login account was created first (Admin -> Create Doctor Account).
- Use the exact password used during account creation.
- If you used the seeding script, re-run `node seed-doctors.js` after the latest fix so doctor accounts are created reliably on first run.

### `404 Not Found` on `GET /doctors/me/profile`
This means authentication worked, but the logged-in doctor user does not have a linked doctor profile yet.

Fix:
- Login as admin.
- Open "Create Doctor Profile".
- Use the doctor `userId` from "Create Doctor Account" and create the profile.
- Re-login as doctor and refresh `/doctor/dashboard`.

## Current Status
✅ Services are running correctly
✅ API endpoints are working
✅ Database connection is successful
❌ No doctors in database (root cause)

## Technical Details
- **Frontend**: Makes requests to `http://localhost:4000/doctors`
- **Gateway**: Routes `/doctors` to doctor-service on port 4002
- **Doctor Service**: Fetches from MongoDB using `Doctor.find()` 
- **Issue**: Empty result set because no documents exist in the doctors collection
