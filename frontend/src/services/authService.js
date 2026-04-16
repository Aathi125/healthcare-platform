import api from "./api";

export const authService = {
  async registerPatient(payload) {
    const { data } = await api.post("/auth/register", payload);
    return data;
  },

  async login(payload) {
    const { data } = await api.post("/auth/login", payload);
    return data;
  },

  async getMe() {
    const { data } = await api.get("/auth/me");
    return data;
  },

  async getDoctorAccounts() {
    const { data } = await api.get("/auth/doctor-accounts");
    return data;
  },

  async createDoctorAccount(payload) {
    const { data } = await api.post("/auth/create-doctor", payload);
    return data;
  }
};
