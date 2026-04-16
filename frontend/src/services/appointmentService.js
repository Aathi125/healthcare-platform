import api from "./api";

export const appointmentService = {
  async getAvailableSlots(params) {
    const { data } = await api.get("/appointments/available-slots", { params });
    return data;
  },

  async bookAppointment(payload) {
    const { data } = await api.post("/appointments", payload);
    return data;
  },

  async getMyAppointments(params = {}) {
    const { data } = await api.get("/appointments/my", { params });
    return data;
  },

  async getMyAppointmentById(id) {
    const { data } = await api.get(`/appointments/my/${id}`);
    return data;
  },

  async updateMyAppointment(id, payload) {
    const { data } = await api.put(`/appointments/my/${id}`, payload);
    return data;
  },

  async cancelMyAppointment(id) {
    const { data } = await api.patch(`/appointments/my/${id}/cancel`);
    return data;
  },

  async getDoctorAppointments(params = {}) {
    const { data } = await api.get("/appointments/doctor", { params });
    return data;
  },

  async getDoctorAppointmentById(id) {
    const { data } = await api.get(`/appointments/doctor/${id}`);
    return data;
  },

  async acceptAppointment(id) {
    const { data } = await api.patch(`/appointments/doctor/${id}/accept`);
    return data;
  },

  async rejectAppointment(id, payload) {
    const { data } = await api.patch(`/appointments/doctor/${id}/reject`, payload);
    return data;
  },

  async completeAppointment(id) {
    const { data } = await api.patch(`/appointments/doctor/${id}/complete`);
    return data;
  }
};
