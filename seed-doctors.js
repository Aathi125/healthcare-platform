const axios = require('axios');

const API_BASE = 'http://localhost:4000';

const sampleDoctors = [
  {
    name: "Dr. John Smith",
    email: "john.smith@hospital.com",
    password: "password123",
    specialization: "Cardiology",
    experience: 10,
    hospital: "City General Hospital",
    consultationFee: 5000,
    availability: [
      { day: "Monday", slots: ["09:00 AM", "10:00 AM", "11:00 AM"] },
      { day: "Wednesday", slots: ["02:00 PM", "03:00 PM"] }
    ]
  },
  {
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@hospital.com",
    password: "password123",
    specialization: "Dermatology",
    experience: 8,
    hospital: "City Medical Center",
    consultationFee: 3000,
    availability: [
      { day: "Tuesday", slots: ["10:00 AM", "11:00 AM"] },
      { day: "Thursday", slots: ["03:00 PM", "04:00 PM"] }
    ]
  },
  {
    name: "Dr. Michael Chen",
    email: "michael.chen@hospital.com",
    password: "password123",
    specialization: "Pediatrics",
    experience: 15,
    hospital: "Children's Hospital",
    consultationFee: 4000,
    availability: [
      { day: "Monday", slots: ["08:00 AM", "09:00 AM"] },
      { day: "Friday", slots: ["01:00 PM", "02:00 PM", "03:00 PM"] }
    ]
  },
  {
    name: "Dr. Emily Davis",
    email: "emily.davis@hospital.com",
    password: "password123",
    specialization: "Orthopedics",
    experience: 12,
    hospital: "Sports Medicine Clinic",
    consultationFee: 6000,
    availability: [
      { day: "Wednesday", slots: ["10:00 AM", "11:00 AM"] },
      { day: "Saturday", slots: ["09:00 AM"] }
    ]
  },
  {
    name: "Dr. Robert Wilson",
    email: "robert.wilson@hospital.com",
    password: "password123",
    specialization: "Neurology",
    experience: 20,
    hospital: "Neuro Care Center",
    consultationFee: 8000,
    availability: [
      { day: "Tuesday", slots: ["02:00 PM", "03:00 PM"] },
      { day: "Thursday", slots: ["11:00 AM", "12:00 PM"] }
    ]
  }
];

async function seedDoctors() {
  try {
    let adminToken;
    
    console.log('Creating/Getting admin account...');
    try {
      await axios.post(`${API_BASE}/auth/create-admin`, {
        name: "Admin User",
        email: "admin@hospital.com",
        password: "admin123"
      });
      console.log('Admin account created successfully');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already in use')) {
        console.log('Admin account already exists');
      } else {
        throw error;
      }
    }

    // create-admin does not return a JWT token in this project,
    // so always login to obtain a valid admin token for protected routes.
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: "admin@hospital.com",
      password: "admin123"
    });
    adminToken = loginResponse.data.token;
    console.log('Admin login successful');

    console.log('Creating doctors...');
    
    for (const doctor of sampleDoctors) {
      try {
        // Create doctor account
        const doctorAccountResponse = await axios.post(`${API_BASE}/auth/create-doctor`, {
          name: doctor.name,
          email: doctor.email,
          password: doctor.password
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });

        const userId = doctorAccountResponse.data.user.id;

        // Create doctor profile
        await axios.post(`${API_BASE}/doctors`, {
          userId: userId,
          name: doctor.name,
          email: doctor.email,
          specialization: doctor.specialization,
          experience: doctor.experience,
          hospital: doctor.hospital,
          consultationFee: doctor.consultationFee,
          availability: doctor.availability
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });

        console.log(`✓ Created doctor: ${doctor.name} (${doctor.specialization})`);
      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
          console.log(`- Doctor ${doctor.name} already exists, skipping...`);
        } else {
          console.error(`✗ Failed to create doctor ${doctor.name}:`, error.response?.data?.message || error.message);
        }
      }
    }

    console.log('\nSeeding completed!');
    
    // Verify doctors were created
    const doctorsResponse = await axios.get(`${API_BASE}/doctors`);
    console.log(`\nTotal doctors in database: ${doctorsResponse.data.length}`);
    
    doctorsResponse.data.forEach(doctor => {
      console.log(`- ${doctor.name} - ${doctor.specialization} - ${doctor.hospital}`);
    });

  } catch (error) {
    console.error('Seeding failed:', error.response?.data || error.message);
  }
}

seedDoctors();
