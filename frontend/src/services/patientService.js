import api from "./api";

export const patientService = {
  async getMyProfile() {
    const { data } = await api.get("/patients/me/profile");
    return data;
  },

  async updateMyProfile(payload) {
    const { data } = await api.put("/patients/me/profile", payload);
    return data;
  },

  async uploadMyReport(formData) {
    const { data } = await api.post("/patients/me/reports", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return data;
  },

  async getMyReports() {
    const { data } = await api.get("/patients/me/reports");
    return data;
  },

  async getReportsByPatient(patientId) {
    const { data } = await api.get(`/patients/${patientId}/reports`);
    return data;
  },

  async downloadReport(reportId) {
    const response = await api.get(`/patients/reports/${reportId}/download`, {
      responseType: "blob"
    });
    return response.data;
  },

  async issuePrescription(payload) {
    const { data } = await api.post("/patients/doctor/prescriptions", payload);
    return data;
  },

  async getDoctorPrescriptions(params = {}) {
    const { data } = await api.get("/patients/doctor/prescriptions", { params });
    return data;
  },

  async getMyPrescriptions() {
    const { data } = await api.get("/patients/me/prescriptions");
    return data;
  }
};
