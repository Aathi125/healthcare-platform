import axios from 'axios';

const NOTIFY_URL = process.env.NOTIFICATION_SERVICE_URL;

export const sendAppointmentConfirmation = async ({ appointment }) => {
  try {
    await axios.post(`${NOTIFY_URL}/api/notifications/appointment-confirmed`, {
      patientEmail: appointment.patientEmail,
      patientPhone: appointment.patientPhone,
      patientName:  appointment.patientName,
      doctorName:   appointment.doctorName,
      specialty:    appointment.specialty,
      date:         appointment.appointmentDate,
      startTime:    appointment.startTime,
      endTime:      appointment.endTime,
      type:         appointment.type,
      meetingLink:  appointment.meetingLink,
    });
  } catch (err) {
    // Log but don't crash — notification failure shouldn't break booking
    console.error('Notification service error:', err.message);
  }
};

export const sendCancellationNotice = async ({ appointment }) => {
  try {
    await axios.post(`${NOTIFY_URL}/api/notifications/appointment-cancelled`, {
      patientEmail: appointment.patientEmail,
      patientName:  appointment.patientName,
      doctorName:   appointment.doctorName,
      date:         appointment.appointmentDate,
      startTime:    appointment.startTime,
      reason:       appointment.cancellationReason,
    });
  } catch (err) {
    console.error('Notification service error:', err.message);
  }
};