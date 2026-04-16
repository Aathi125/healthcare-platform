import api from "./api";

export const doctorService = {
  async getDoctors(params = {}) {
    const { data } = await api.get("/doctors", { params });
    return data;
  },

  async getDoctorById(id) {
    const { data } = await api.get(`/doctors/${id}`);
    return data;
  },

  async createDoctorProfile(payload) {
    const { data } = await api.post("/doctors", payload);
    return data;
  },

  async getMyProfile() {
    const { data } = await api.get("/doctors/me/profile");
    return data;
  },

  async updateMyProfile(payload) {
    const { data } = await api.put("/doctors/me/profile", payload);
    return data;
  },

  async updateMyAvailability(payload) {
    const { data } = await api.post("/doctors/me/availability", payload);
    return data;
  },

  async verifyDoctor(id, payload) {
    const { data } = await api.patch(`/doctors/${id}/verify`, payload);
    return data;
  }
};
