Smart Healthcare Setup Instructions

1) Start project with Docker Compose
   docker compose up --build

2) Access frontend
   http://localhost:5173

3) Gateway URL
   http://localhost:4000

4) Important API groups through gateway
   /auth
   /doctors
   /appointments
   /patients
   /payments
   /notifications

5) Recommended demo order
   - Register patient
   - Login as admin and create doctor account/profile
   - Login as doctor and update availability
   - Login as patient and book appointment
   - Login as doctor and accept appointment
   - Login as patient and pay + join Jitsi link
   - Login as doctor and mark completed + issue prescription
   - Login as patient and view prescription and reports

6) Kubernetes
   Use YAML files in k8s folder.
   Read k8s/README.md for deployment order.
