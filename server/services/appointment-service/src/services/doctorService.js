import axios from 'axios';

const DOCTOR_URL = process.env.DOCTOR_SERVICE_URL;

// Fetch doctor profile — validate doctor exists and get fee/name
export const getDoctorById = async (doctorId) => {
  const { data } = await axios.get(`${DOCTOR_URL}/api/doctors/${doctorId}`);
  return data;
};

// Fetch available slots for a doctor on a date
export const getAvailableSlots = async (doctorId, date) => {
  const { data } = await axios.get(
    `${DOCTOR_URL}/api/schedules/slots/${doctorId}`,
    { params: { date } }
  );
  return data; // { slots: [...], slotDurationMinutes }
};

// Tell Doctor Service to update rating after review
export const pushRatingUpdate = async (doctorId, rating) => {
  await axios.patch(`${DOCTOR_URL}/api/doctors/${doctorId}/rating`, { rating });
};